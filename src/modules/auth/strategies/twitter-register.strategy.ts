import { PassportStrategy } from '@nestjs/passport';
import { config } from 'dotenv';
import { Strategy } from 'passport-twitter';
import { Injectable } from '@nestjs/common';

config();

@Injectable()
export class TwitterRegisterStrategy extends PassportStrategy(Strategy, 'twitter-register') {

  constructor() {
    super({
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/users/register/twitter/redirect`,
      includeEmail: true,
      email: true,
      userProfileURL: "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true", 
      scope: ['users.read']
    });
  }

  async validate (token: string, secret: string, profile: any, done: any): Promise<any> {
    console.log(profile)
    done(null, profile);
  }
}