import { IsNotEmpty, IsString } from 'class-validator';

export class CancelSubscriptionPayload {
  @IsNotEmpty()
  @IsString()
  performerId: string;

  @IsNotEmpty()
  @IsString()
  userId: string;
}
