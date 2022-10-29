import { Inject, Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { merge } from 'lodash';
import { EntityNotFoundException } from 'src/kernel';
import { WalletPackageDto } from '../dtos';
import { WalletPackageModel } from '../models';
import { WalletPackageCreatePayload, WalletPackageUpdatePayload } from '../payloads';
import { TOKEN_PACKAGE_PROVIDER } from '../providers';

@Injectable()
export class WalletPackageService {
  constructor(
    @Inject(TOKEN_PACKAGE_PROVIDER)
    private readonly WalletPackage: Model<WalletPackageModel>
  ) {}

  public async create(payload: WalletPackageCreatePayload): Promise<WalletPackageModel> {
    const data = { ...payload } as any;
    if (!data.token) {
      data.token = data.price;
    }
    const walletPackage = await this.WalletPackage.create(data);
    return walletPackage;
  }

  async update(id: string | ObjectId, payload: WalletPackageUpdatePayload): Promise<any> {
    const walletPackage = await this.WalletPackage.findOne({ _id: id });
    if (!walletPackage) {
      throw new EntityNotFoundException();
    }

    merge(walletPackage, payload);
    if (!payload.token) {
      walletPackage.token = walletPackage.price;
    }
    walletPackage.updatedAt = new Date();
    return walletPackage.save();
  }

  delete(id: string | ObjectId) {
    return this.WalletPackage.deleteOne({ _id: id });
  }

  async findById(id: string | ObjectId): Promise<WalletPackageDto> {
    const walletPackage = await this.WalletPackage.findOne({ _id: id });
    return new WalletPackageDto(walletPackage);
  }
}
