import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users, UsersDocument } from './schemas/users.schema';
import {createMACIKeypair} from "../../utils/genMaciKey";
import { UserDto } from '@/dto/user.dto';
import { InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(@InjectModel(Users.name) private usersModel: Model<UsersDocument>) {}

   private mapToUserDto(user: any,privateKey:string): UserDto {
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
       privateKey: privateKey 
    };
  }

  async findByEmail(email: string): Promise<UsersDocument | null> {
    return this.usersModel.findOne({ email }).exec();
  }

  async findByGoogleId(googleId: string): Promise<UsersDocument | null> {
    return this.usersModel.findOne({ googleId }).exec();
  }
  async findByEmailAndAuthType(email: string,typeAuth:string): Promise<UsersDocument | null> {
    return this.usersModel.findOne({ email,typeAuth}).exec();
  }
  async findByGithubId(githubId: string): Promise<UsersDocument | null> {
    return this.usersModel.findOne({ githubId }).exec();
  } 
  async findByWalletAddress(walletAddress: string): Promise<UsersDocument | null> {
    return this.usersModel.findOne({ walletAddress }).exec();
  }

  async findById(id: string): Promise<UsersDocument | null> {
    return this.usersModel.findById(id).exec();
    }

  async createGoogleUser(profile: { googleId: string; email: string; name: string }): Promise<UsersDocument> {
    const newUser = new this.usersModel({
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      role: 'user',
      authType: 'google',
    });
    return newUser.save();
  }
  async createGithubUser(profile: { githubId: string; email: string; name: string }): Promise<UsersDocument> {
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
    const genKey =  createMACIKeypair();
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
    } 
    else if (currentWallet === newWallet) {
      return true;
    } 
    else {
      throw new BadRequestException('Wallet address already connected to another account');
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
async updateBalance(userId: string, amount: number,txHash:string): Promise<UsersDocument | null> {
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

    await user.save()
    return user;
  }
}