import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users, UsersDocument } from '../users/schemas/users.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ethers } from 'ethers';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Users.name)
    private usersModel: Model<UsersDocument>,
    private jwtService: JwtService,
    @InjectRedis() private readonly redis: Redis,
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

    const existingWallet = await this.usersModel.findOne({ walletAddress }).exec();
    if (existingWallet) {
      throw new BadRequestException('This wallet address is already linked to another account');
    }

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

  async signinWithEmail(email: string, password: string) {
    const user = await this.usersModel.findOne({ email }).exec();
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user);
  }

  async signupWithGoogle(googleId: string, email: string, walletAddress: string, signature?: string) {
    if (!ethers.utils.isAddress(walletAddress)) {
      throw new BadRequestException('Invalid wallet address');
    }

    const existingWallet = await this.usersModel.findOne({ walletAddress }).exec();
    if (existingWallet) {
      throw new BadRequestException('This wallet address is already linked to another account');
    }

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

  async signinWithGoogle(googleId: string) {
    const user = await this.usersModel.findOne({ googleId }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid Google account');
    }

    return this.generateToken(user);
  }

  async signupWithGithub(githubId: string, email: string, walletAddress: string, signature?: string) {
    if (!ethers.utils.isAddress(walletAddress)) {
      throw new BadRequestException('Invalid wallet address');
    }

    const existingWallet = await this.usersModel.findOne({ walletAddress }).exec();
    if (existingWallet) {
      throw new BadRequestException('This wallet address is already linked to another account');
    }

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

  async signinWithGithub(githubId: string) {
    const user = await this.usersModel.findOne({ githubId }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid Github account');
    }

    return this.generateToken(user);
  }

  async signinWithMetamask(walletAddress: string, signature: string) {
    if (!ethers.utils.isAddress(walletAddress)) {
      throw new BadRequestException('Invalid wallet address');
    }
    const message = 'Sign to login with Metamask';
    const signerAddress = ethers.utils.verifyMessage(message, signature);
    if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new BadRequestException('Invalid signature');
    }

    const user = await this.usersModel.findOne({ walletAddress }).exec();
    if (!user) {
      throw new UnauthorizedException('Wallet address not linked to any account');
    }

    return this.generateToken(user);
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.usersModel.findById(payload.sub).exec();
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const storedRefreshToken = await this.redis.get(`user:${user._id}:refresh_token`);
      if (storedRefreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateToken(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.redis.del(`user:${userId}:access_token`);
    await this.redis.del(`user:${userId}:refresh_token`);
  }

  private async generateToken(user: UsersDocument) {
    const payload = { email: user.email, sub: user._id.toString(), walletAddress: user.walletAddress, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    await this.redis.set(
      `user:${user._id}:access_token`,
      accessToken,
      'EX',
      15 * 60, // 15 minutes
    );
    await this.redis.set(
      `user:${user._id}:refresh_token`,
      refreshToken,
      'EX',
      7 * 24 * 60 * 60, // 7 days
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}