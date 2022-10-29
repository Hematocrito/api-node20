import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class RankingPerformerModel extends Document {
  performerId: ObjectId;

  ordering: number;

  createdAt: Date;

  updatedAt: Date;
}
