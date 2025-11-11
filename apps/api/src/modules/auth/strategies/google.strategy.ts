import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifiedCallback } from 'passport-google-oauth20'; // Sửa import VerifiedCallback từ passport-google-oauth20 nếu cần
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: 'http://localhost:8000/auth/signin/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifiedCallback): Promise<any> {
    const { id, emails, displayName } = profile;
    const user = {
      googleId: id,
      email: emails[0].value,
      name: displayName,
    };
    done(null, user);
  }
}