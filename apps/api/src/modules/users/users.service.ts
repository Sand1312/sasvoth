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
}