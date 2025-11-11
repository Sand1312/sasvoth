import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users, UsersDocument } from '../users/schemas/users.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ){}

  async validateGoogleUser(profile: { googleId: string; email: string; name: string }){ 
    const user = await this.usersService.findByGoogleId(profile.googleId);
    if (user) {
      return user;
    }
    return this.usersService.createGoogleUser(profile);

  }
  async validateGithubUser(profile: { githubId: string; email: string; name: string }){ 
    const user = await this.usersService.findByGithubId(profile.githubId);
    if (user) {
      return user;
    }
    return this.usersService.createGithubUser(profile);

  }
  async validateWalletUser(address: string, signature: string) {
    const user = await this.usersService.findByWalletAddress(address);
    if (!user) {
      return this.usersService.createWalletUser(address);
    }
    return user;
  }
  async signUpEmail(email: string, password: string) {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.usersService.createUser(email, hashedPassword);
  }
  
  async signInEmail(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
async generateTokens(userId: string) {
    const accessSecret = this.configService.get('JWT_ACCESS_SECRET');
    const refreshSecret = this.configService.get('JWT_REFRESH_SECRET');
    
    const accessToken = this.jwtService.sign({ sub: userId }, { secret: accessSecret, expiresIn: '15m' });
    const refreshToken = this.jwtService.sign({ sub: userId }, { secret: refreshSecret, expiresIn: '7d' });
    // Hash refresh và lưu Redis (TTL 7d, để revoke)
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.redis.set(`refresh:${userId}`, refreshHash, 'EX', 7 * 24 * 60 * 60);

    return { accessToken, refreshToken };
  }

  async refreshToken(oldRefreshToken: string) {
    try {
      const refreshSecret = this.configService.get('JWT_REFRESH_SECRET');
      const payload = this.jwtService.verify(oldRefreshToken, refreshSecret);
      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new UnauthorizedException();

      const storedHash = await this.redis.get(`refresh:${payload.sub}`);
      const newHash = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');
      if (storedHash !== newHash) throw new UnauthorizedException('Invalid refresh token');

      return this.generateTokens(payload.sub);
    } catch {
      throw new UnauthorizedException();
    }
  }
  async logout(userId: string) {
    await this.redis.del(`refresh:${userId}`);
  }
}