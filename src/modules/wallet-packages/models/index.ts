import { Document } from 'mongoose';

export class WalletPackageModel extends Document {
  name: string;

  description: string;

  ordering: number;

  createdAt: Date;

  updatedAt: Date;

  price: number;

  token: number;

  status: string;

  url: string;
}
