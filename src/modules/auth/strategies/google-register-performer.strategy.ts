import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { config } from 'dotenv';

import { Injectable } from '@nestjs/common';

config();

/**
 * Stragegy for Register Performers with Google
 */
@Injectable()
export class GoogleRegisterPerformerStrategy extends PassportStrategy(Strategy, 'google-register-performer') {

  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/performers/register/google/redirect`,
      scope: ['email', 'profile', 'https://www.googleapis.com/auth/user.gender.read', 'https://www.googleapis.com/auth/user.addresses.read'],
    });
  }

  async validate (accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    done(null, profile._json);
  }
}