import { HttpException } from '@nestjs/common';

export class StreamOfflineException extends HttpException {
  constructor() {
    super('STREAM_OFFLINE', 400);
  }
}
