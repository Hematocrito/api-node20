import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PurchaseTokenPayload {
  @IsNotEmpty()
  @IsString()
  walletPackageId: string;

  @IsOptional()
  @IsString()
  paymentGateway: string;
}
