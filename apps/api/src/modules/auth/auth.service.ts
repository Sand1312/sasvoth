import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users, UsersDocument } from '../users/schemas/users.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ethers } from 'ethers';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Users.name)
    private usersModel: Model<UsersDocument>,
    private jwtService: JwtService,
  ) {}

  async signupWithEmail(email: string, password: string, rePassword: string, walletAddress: string, signature?: string) {
    if (password !== rePassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existingUser = await this.usersModel.findOne({ email }).exec();
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    if (!ethers.utils.isAddress(walletAddress)) {
      throw new BadRequestException('Invalid wallet address');
    }

    // Kiểm tra trùng lặp walletAddress
    const existingWallet = await this.usersModel.findOne({ walletAddress }).exec();
    if (existingWallet) {
      throw new BadRequestException('This wallet address is already linked to another account');
    }

    // Xác minh chữ ký nếu được cung cấp
    if (signature) {
      const message = 'Sign to register your account';
      const signerAddress = ethers.utils.verifyMessage(message, signature);
      if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new BadRequestException('Invalid signature');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.usersModel({
      email,
      password: hashedPassword,
      walletAddress,
      role: 'user',
    });

    try {
      await user.save();
    } catch (error) {
      if (error.code === 11000 && error.keyPattern?.walletAddress) {
        throw new BadRequestException('This wallet address is already linked to another account');
      }
      throw error;
    }

    return this.generateToken(user);
  }

  async signinWithEmail(email: string, password: string, walletAddress: string, signature?: string) {
    const user = await this.usersModel.findOne({ email }).exec();
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.walletAddress !== walletAddress) {
      throw new UnauthorizedException('Invalid wallet address');
    }

    // Xác minh chữ ký nếu được cung cấp
    if (signature) {
      const message = 'Sign to login to your account';
      const signerAddress = ethers.utils.verifyMessage(message, signature);
      if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new UnauthorizedException('Invalid signature');
      }
    }

    return this.generateToken(user);
  }

  async signupWithGoogle(googleId: string, email: string, walletAddress: string, signature?: string) {
    if (!ethers.utils.isAddress(walletAddress)) {
      throw new BadRequestException('Invalid wallet address');
    }

    // Kiểm tra trùng lặp walletAddress
    const existingWallet = await this.usersModel.findOne({ walletAddress }).exec();
    if (existingWallet) {
      throw new BadRequestException('This wallet address is already linked to another account');
    }

    // Xác minh chữ ký nếu được cung cấp
    if (signature) {
      const message = 'Sign to register with Google';
      const signerAddress = ethers.utils.verifyMessage(message, signature);
      if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new BadRequestException('Invalid signature');
      }
    }

    let user = await this.usersModel.findOne({ googleId }).exec();
    if (!user) {
      const existingEmail = await this.usersModel.findOne({ email }).exec();
      if (existingEmail) {
        throw new BadRequestException('Email already exists with another sign-in method');
      }
      user = new this.usersModel({
        email,
        googleId,
        walletAddress,
        role: 'user',
      });
      try {
        await user.save();
      } catch (error) {
        if (error.code === 11000 && error.keyPattern?.walletAddress) {
          throw new BadRequestException('This wallet address is already linked to another account');
        }
        throw error;
      }
    } else if (user.walletAddress !== walletAddress) {
      throw new BadRequestException('Wallet address does not match');
    }

    return this.generateToken(user);
  }

  async signinWithGoogle(googleId: string, walletAddress: string, signature?: string) {
    const user = await this.usersModel.findOne({ googleId }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid Google account');
    }

    if (user.walletAddress !== walletAddress) {
      throw new UnauthorizedException('Invalid wallet address');
    }

    // Xác minh chữ ký nếu được cung cấp
    if (signature) {
      const message = 'Sign to login with Google';
      const signerAddress = ethers.utils.verifyMessage(message, signature);
      if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new UnauthorizedException('Invalid signature');
      }
    }

    return this.generateToken(user);
  }

  async signupWithGithub(githubId: string, email: string, walletAddress: string, signature?: string) {
    if (!ethers.utils.isAddress(walletAddress)) {
      throw new BadRequestException('Invalid wallet address');
    }

    // Kiểm tra trùng lặp walletAddress
    const existingWallet = await this.usersModel.findOne({ walletAddress }).exec();
    if (existingWallet) {
      throw new BadRequestException('This wallet address is already linked to another account');
    }

    // Xác minh chữ ký nếu được cung cấp
    if (signature) {
      const message = 'Sign to register with Github';
      const signerAddress = ethers.utils.verifyMessage(message, signature);
      if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new BadRequestException('Invalid signature');
      }
    }

    let user = await this.usersModel.findOne({ githubId }).exec();
    if (!user) {
      const existingEmail = await this.usersModel.findOne({ email }).exec();
      if (existingEmail) {
        throw new BadRequestException('Email already exists with another sign-in method');
      }
      user = new this.usersModel({
        email,
        githubId,
        walletAddress,
        role: 'user',
      });
      try {
        await user.save();
      } catch (error) {
        if (error.code === 11000 && error.keyPattern?.walletAddress) {
          throw new BadRequestException('This wallet address is already linked to another account');
        }
        throw error;
      }
    } else if (user.walletAddress !== walletAddress) {
      throw new BadRequestException('Wallet address does not match');
    }

    return this.generateToken(user);
  }

  async signinWithGithub(githubId: string, walletAddress: string, signature?: string) {
    const user = await this.usersModel.findOne({ githubId }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid Github account');
    }

    if (user.walletAddress !== walletAddress) {
      throw new UnauthorizedException('Invalid wallet address');
    }

    // Xác minh chữ ký nếu được cung cấp
    if (signature) {
      const message = 'Sign to login with Github';
      const signerAddress = ethers.utils.verifyMessage(message, signature);
      if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new UnauthorizedException('Invalid signature');
      }
    }

    return this.generateToken(user);
  }

  async changeWalletAddress(userId: string, newWalletAddress: string, signature: string) {
    if (!ethers.utils.isAddress(newWalletAddress)) {
      throw new BadRequestException('Invalid wallet address');
    }

    // Xác minh chữ ký cho ví mới
    const message = 'Sign to change your wallet address';
    const signerAddress = ethers.utils.verifyMessage(message, signature);
    if (signerAddress.toLowerCase() !== newWalletAddress.toLowerCase()) {
      throw new BadRequestException('Invalid signature');
    }

    // Kiểm tra trùng lặp walletAddress
    const existingWallet = await this.usersModel.findOne({ walletAddress: newWalletAddress }).exec();
    if (existingWallet) {
      throw new BadRequestException('This wallet address is already linked to another account');
    }

    const user = await this.usersModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    user.walletAddress = newWalletAddress;
    await user.save();

    return this.generateToken(user);
  }

  private async generateToken(user: UsersDocument) {
    const payload = { email: user.email, sub: user._id.toString(), walletAddress: user.walletAddress, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}