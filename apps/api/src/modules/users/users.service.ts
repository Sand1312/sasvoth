import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users, UsersDocument } from './schemas/users.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(Users.name) private usersModel: Model<UsersDocument>) {}

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
  async createWalletUser(walletAddress: string): Promise<UsersDocument> {
    const newUser = new this.usersModel({
      walletAddress,
      name: walletAddress,
      role: 'user', 
      authType: 'wallet',
    });
    return newUser.save();
  }
}