import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users, UsersDocument } from '../../users/schemas/users.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(Users.name)
    private usersModel: Model<UsersDocument>,
  ) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
    throw new Error('JWT_SECRET is not defined');
    }   

    super({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration: false,
    secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const user = await this.usersModel.findById(payload.sub).exec();
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}