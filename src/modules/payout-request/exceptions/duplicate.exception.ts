import { HttpException } from '@nestjs/common';

export class DuplicateRequestException extends HttpException {
  constructor() {
    super('Please wait for the previous payout to be closed.', 400);
  }
}
