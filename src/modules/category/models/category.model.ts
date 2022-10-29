import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class CategoryModel extends Document {
  group: string;

  name: string;

  slug: string;

  description: string;

  status: string;

  ordering: number;

  createdBy: ObjectId;

  updatedBy: ObjectId;

  createdAt: Date;

  updatedAt: Date;
}
