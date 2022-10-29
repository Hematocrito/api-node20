import { Injectable, Inject } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { BankingModel } from '../models';
import { PERFORMER_BANKING_SETTING_MODEL_PROVIDER } from '../providers';

@Injectable()
export class PerformerBankingService {
  constructor(@Inject(PERFORMER_BANKING_SETTING_MODEL_PROVIDER) private readonly bankingModal: Model<BankingModel>) {}

  async findById(performerId: string | ObjectId) {
    const banking = await this.bankingModal.findOne({ performerId });
    return banking;
  }
}
