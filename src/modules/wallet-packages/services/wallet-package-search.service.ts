import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData } from 'src/kernel';
import { WalletPackageDto } from '../dtos';
import { WalletPackageModel } from '../models';
import { WalletPackageSearchRequest } from '../payloads';
import { TOKEN_PACKAGE_PROVIDER } from '../providers';

@Injectable()
export class WalletPackageSearchService {
  constructor(
    @Inject(TOKEN_PACKAGE_PROVIDER)
    private readonly WalletPackage: Model<WalletPackageModel>
  ) {}

  public async search(req: WalletPackageSearchRequest): Promise<PageableData<WalletPackageDto>> {
    const query = {
      status: 'active'
    } as any;
    if (req.q) {
      query.$or = [
        {
          name: { $regex: req.q }
        }
      ];
    }

    const sort = {
      [req.sortBy || 'updatedAt']: req.sort
    };
    const [walletPackages, total] = await Promise.all([
      this.WalletPackage
        .find(query)
        .sort(sort)
        .lean()
        .skip(parseInt(req.offset as string, 10))
        .limit(parseInt(req.limit as string, 10))
        .exec(),
      this.WalletPackage.count(query)
    ]);

    return {
      total,
      data: walletPackages.map((walletPackage) => new WalletPackageDto(walletPackage))
    };
  }

  public async adminSearch(req: WalletPackageSearchRequest): Promise<PageableData<WalletPackageDto>> {
    const query = {} as any;
    if (req.q) {
      query.$or = [
        {
          name: { $regex: req.q }
        }
      ];
    }
    if (req.status) query.status = req.status;
    const sort = {
      [req.sortBy || 'updatedAt']: req.sort
    };
    const [walletPackages, total] = await Promise.all([
      this.WalletPackage
        .find(query)
        .sort(sort)
        .lean()
        .skip(parseInt(req.offset as string, 10))
        .limit(parseInt(req.limit as string, 10))
        .exec(),
      this.WalletPackage.count(query)
    ]);

    return {
      total,
      data: walletPackages.map((walletPackage) => new WalletPackageDto(walletPackage))
    };
  }
}
