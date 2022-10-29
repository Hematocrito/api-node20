import { Schema } from 'mongoose';
import { WalletPackageStatus } from '../contants';

export const walletPackageSchema = new Schema(
  {
    name: String,
    description: String,
    ordering: {
      type: Number,
      default: 0
    },
    url: String,
    createdAt: { type: Date, default: new Date() },
    updatedAt: Date,
    status: {
      type: String,
      enum: [WalletPackageStatus.Active, WalletPackageStatus.Inactive],
      default: WalletPackageStatus.Inactive,
      index: true
    },
    price: {
      default: 0,
      type: Number
    },
    token: {
      default: 0,
      type: Number
    }
  }
);
