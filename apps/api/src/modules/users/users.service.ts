import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users, UsersDocument } from './schemas/users.schema';
import { createMACIKeypair } from '../../utils/genMaciKey';
import { UserDto } from '@/dto/user.dto';
import { InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Users.name) private usersModel: Model<UsersDocument>,
  ) {}

  private mapToUserDto(user: any, privateKey: string): UserDto {
    return {
      id: user._id?.toString() || user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      walletAddress: user.walletAddress,
      authType: user.authType,
      publicKey: user.publicKey,
      publicKeyX: user.publicKeyX,
      publicKeyY: user.publicKeyY,
      stateIndex: user.stateIndex,
      privateKey: privateKey,
      avatar: user.avatar,
      dateOfBirth: user.dateOfBirth,
    };
  }

  async findByEmail(email: string): Promise<UsersDocument | null> {
    return this.usersModel.findOne({ email }).exec();
  }

  async findByGoogleId(googleId: string): Promise<UsersDocument | null> {
    return this.usersModel.findOne({ googleId }).exec();
  }
  async findByEmailAndAuthType(
    email: string,
    typeAuth: string,
  ): Promise<UsersDocument | null> {
    return this.usersModel.findOne({ email, typeAuth }).exec();
  }
  async findByGithubId(githubId: string): Promise<UsersDocument | null> {
    return this.usersModel.findOne({ githubId }).exec();
  }
  async findByWalletAddress(
    walletAddress: string,
  ): Promise<UsersDocument | null> {
    return this.usersModel.findOne({ walletAddress }).exec();
  }

  async findById(id: string): Promise<UsersDocument | null> {
    return this.usersModel.findById(id).exec();
  }

  async findAll(
    options: {
      page?: number;
      limit?: number;
      search?: string;
    } = {},
  ): Promise<{
    users: UsersDocument[];
    total: number;
    page: number;
    limit: number;
    todaySignups: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (options.search) {
      query.$or = [
        { email: { $regex: options.search, $options: 'i' } },
        { name: { $regex: options.search, $options: 'i' } },
        { walletAddress: { $regex: options.search, $options: 'i' } },
      ];
    }

    // Calculate today's start
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [users, total, todaySignups] = await Promise.all([
      this.usersModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password -privateKey')
        .exec(),
      this.usersModel.countDocuments(query).exec(),
      this.usersModel.countDocuments({ createdAt: { $gte: today } }).exec(),
    ]);

    return { users, total, page, limit, todaySignups };
  }

  async createGoogleUser(profile: {
    googleId: string;
    email: string;
    name: string;
  }): Promise<UsersDocument> {
    const newUser = new this.usersModel({
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      role: 'user',
      authType: 'google',
    });
    return newUser.save();
  }
  async createGithubUser(profile: {
    githubId: string;
    email: string;
    name: string;
  }): Promise<UsersDocument> {
    const newUser = new this.usersModel({
      githubId: profile.githubId,
      email: profile.email,
      name: profile.name,
      role: 'user',
      authType: 'github',
    });
    return newUser.save();
  }
  async createUser(email: string, password: string): Promise<UsersDocument> {
    const newUser = new this.usersModel({
      email,
      password,
      name: email.split('@')[0],
      role: 'user',
    });
    return newUser.save();
  }
  async createWalletUser(walletAddress: string): Promise<UserDto> {
    const newUser = new this.usersModel({
      walletAddress,
      name: walletAddress,
      role: 'user',
      authType: 'wallet',
    });
    const genKey = createMACIKeypair();
    newUser.publicKey = genKey.publicKey;
    newUser.publicKeyX = genKey.publicKeyAsContractParam.X;
    newUser.publicKeyY = genKey.publicKeyAsContractParam.Y;
    const privateKey = genKey.privateKey;

    return this.mapToUserDto(await newUser.save(), privateKey);
  }

  async connectWallet(userId: string, walletAddress: string): Promise<any> {
    try {
      const user = await this.usersModel.findById(userId).exec();

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const currentWallet = user.walletAddress?.toLowerCase();
      const newWallet = walletAddress.toLowerCase();

      if (!currentWallet) {
        user.walletAddress = walletAddress;
        const genKey = createMACIKeypair();
        user.publicKey = genKey.publicKey;
        user.publicKeyX = genKey.publicKeyAsContractParam.X;
        user.publicKeyY = genKey.publicKeyAsContractParam.Y;
        const privateKey = genKey.privateKey;

        await user.save();

        return privateKey;
      } else if (currentWallet === newWallet) {
        return true;
      } else {
        throw new BadRequestException(
          'Wallet address already connected to another account',
        );
      }
    } catch (error) {
      throw error;
    }
  }
  async getHistoryDeposit(userId: string): Promise<any[]> {
    const user = await this.usersModel.findById(userId).exec();
    if (!user) {
      throw new InternalServerErrorException('User not found');
    }
    return user.historyDeposit || [];
  }
  async updateBalance(
    userId: string,
    amount: number,
    txHash: string,
  ): Promise<UsersDocument | null> {
    let user = await this.usersModel.findById(userId).exec();
    if (!user) {
      throw new InternalServerErrorException('User not found');
    }
    user.historyDeposit.push({
      amount,
      timestamp: new Date(),
      txHash,
    });

    user.balance += amount;

    await user.save();
    return user;
  }
  async updateStateIndex(
    walletAddress: string,
    stateIndex: number,
  ): Promise<void> {
    const user = await this.usersModel
      .findOne({ walletAddress: walletAddress })
      .exec();
    if (!user) {
      throw new InternalServerErrorException('User not found');
    }
    user.stateIndex = stateIndex;
    await user.save();
  }

  /**
   * Add MACI signup record for a user (upsert to prevent duplicates)
   *
   * ACID Note: On-chain signup has no rollback.
   * This is called AFTER on-chain signup succeeds.
   * If this fails, the user IS signed up on-chain but not in DB.
   * Stats sync job reconciles any inconsistencies periodically.
   *
   * @param walletAddress - User's wallet address
   * @param signup - MACI signup data
   */
  async addMaciSignup(
    walletAddress: string,
    signup: {
      maciAddress: string;
      stateIndex: number;
      publicKey: string;
      txHash?: string;
    },
  ): Promise<void> {
    // Use atomic update to prevent race conditions
    // $addToSet won't add if exact match exists
    // But we want to upsert by maciAddress, so use findOneAndUpdate with arrayFilters
    const result = await this.usersModel
      .findOneAndUpdate(
        {
          walletAddress: walletAddress.toLowerCase(),
          // Check if signup for this maciAddress doesn't already exist
          'maciSignups.maciAddress': { $ne: signup.maciAddress.toLowerCase() },
        },
        {
          $push: {
            maciSignups: {
              maciAddress: signup.maciAddress.toLowerCase(),
              stateIndex: signup.stateIndex,
              publicKey: signup.publicKey,
              txHash: signup.txHash,
              signedUpAt: new Date(),
            },
          },
          // Also update legacy stateIndex field for backward compatibility
          $set: { stateIndex: signup.stateIndex },
        },
        { new: true },
      )
      .exec();

    // If result is null, either user doesn't exist OR signup already exists
    // Try to check if signup exists
    if (!result) {
      const user = await this.usersModel
        .findOne({
          walletAddress: walletAddress.toLowerCase(),
        })
        .exec();

      if (!user) {
        // User doesn't exist - this is fine, they may not have logged in yet
        // Log warning but don't throw (best-effort save)
        console.warn(
          `[UsersService] Cannot save MACI signup: wallet ${walletAddress} not found in DB`,
        );
        return;
      }

      // User exists, signup already recorded - just update stateIndex if different
      const existing = user.maciSignups?.find(
        (s) => s.maciAddress.toLowerCase() === signup.maciAddress.toLowerCase(),
      );

      if (existing && existing.stateIndex !== signup.stateIndex) {
        // Update existing signup's stateIndex (shouldn't happen but just in case)
        await this.usersModel
          .updateOne(
            {
              walletAddress: walletAddress.toLowerCase(),
              'maciSignups.maciAddress': signup.maciAddress.toLowerCase(),
            },
            {
              $set: {
                'maciSignups.$.stateIndex': signup.stateIndex,
                stateIndex: signup.stateIndex,
              },
            },
          )
          .exec();
      }
    }
  }

  /**
   * Get user's MACI signup info for a specific MACI address
   */
  async getMaciSignup(
    walletAddress: string,
    maciAddress: string,
  ): Promise<{
    stateIndex: number;
    publicKey: string;
    signedUpAt: Date;
  } | null> {
    const user = await this.usersModel
      .findOne({
        walletAddress: walletAddress.toLowerCase(),
      })
      .exec();

    if (!user || !user.maciSignups) return null;

    const signup = user.maciSignups.find(
      (s) => s.maciAddress.toLowerCase() === maciAddress.toLowerCase(),
    );

    return signup
      ? {
          stateIndex: signup.stateIndex,
          publicKey: signup.publicKey,
          signedUpAt: signup.signedUpAt,
        }
      : null;
  }

  // NOTE: hasMaciSignup() intentionally NOT provided
  // Reason: DB-only check could be manipulated to deny voting rights
  // On-chain verification is the only source of truth for signup status

  async updateProfile(
    userId: string,
    data: { avatar?: string; dateOfBirth?: Date },
  ): Promise<UsersDocument | null> {
    const user = await this.usersModel.findById(userId).exec();
    if (!user) {
      throw new InternalServerErrorException('User not found');
    }
    if (data.avatar !== undefined) {
      user.avatar = data.avatar;
    }
    if (data.dateOfBirth !== undefined) {
      user.dateOfBirth = data.dateOfBirth;
    }
    await user.save();
    return user;
  }
}
