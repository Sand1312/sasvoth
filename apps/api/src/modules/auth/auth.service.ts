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

  async signupWithEmail(email: string, password: string, rePassword: string, walletAddress: string) {
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

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.usersModel({
      email,
      password: hashedPassword,
      walletAddress,
      role: 'user',
    });

    await user.save();
    return this.generateToken(user);
  }

  async signinWithEmail(email: string, password: string, walletAddress: string) {
    const user = await this.usersModel.findOne({ email }).exec();
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.walletAddress !== walletAddress) {
      throw new UnauthorizedException('Invalid wallet address');
    }

    return this.generateToken(user);
  }

  async signupWithGoogle(googleId: string, email: string, walletAddress: string) {
    if (!ethers.utils.isAddress(walletAddress)) {
      throw new BadRequestException('Invalid wallet address');
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
      await user.save();
    } else if (user.walletAddress !== walletAddress) {
      throw new BadRequestException('Wallet address does not match');
    }

    return this.generateToken(user);
  }

  async signinWithGoogle(googleId: string, email: string, walletAddress: string) {
    const user = await this.usersModel.findOne({ googleId }).exec();
    if (!user || user.email !== email) {
      throw new UnauthorizedException('Invalid Google account');
    }

    if (user.walletAddress !== walletAddress) {
      throw new UnauthorizedException('Invalid wallet address');
    }

    return this.generateToken(user);
  }

  async signupWithGithub(githubId: string, email: string, walletAddress: string) {
    if (!ethers.utils.isAddress(walletAddress)) {
      throw new BadRequestException('Invalid wallet address');
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
      await user.save();
    } else if (user.walletAddress !== walletAddress) {
      throw new BadRequestException('Wallet address does not match');
    }

    return this.generateToken(user);
  }

  async signinWithGithub(githubId: string, email: string, walletAddress: string) {
    const user = await this.usersModel.findOne({ githubId }).exec();
    if (!user || user.email !== email) {
      throw new UnauthorizedException('Invalid Github account');
    }

    if (user.walletAddress !== walletAddress) {
      throw new UnauthorizedException('Invalid wallet address');
    }

    return this.generateToken(user);
  }

  private async generateToken(user: UsersDocument) {
    const payload = { email: user.email, sub: user._id.toString(), walletAddress: user.walletAddress, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}