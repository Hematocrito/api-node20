import { HttpException } from '@nestjs/common';

export class NotEnoughWalletException extends HttpException {
  constructor() {
    super('Your tokens are not enough, please top-up your wallet', 400);
  }
}
