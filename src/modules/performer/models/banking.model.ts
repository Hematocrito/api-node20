import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class BankingModel extends Document {
  firstName?: string;

  lastName?: string;

  SSN?: string;

  bankName?: string;

  bankAccount?: string;

  bankRouting?: string;

  bankSwiftCode?: string;

  address?: string;

  city?: string;

  state?: string;

  country?: string;

  performerId: ObjectId;

  createdAt: Date;

  updatedAt: Date;
}
