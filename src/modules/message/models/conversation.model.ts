import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export interface IRecipient {
  source: string;
  sourceId: ObjectId;
}

export class ConversationModel extends Document {
  type: string;

  name: string;

  lastMessage: string;

  lastSenderId: ObjectId;

  recipients: IRecipient[];

  meta: any;

  createdAt: Date;

  updatedAt: Date;

  streamId: ObjectId;

  performerId: ObjectId;
}

export class UserConversationModel extends Document {
  type: string;

  name: string;

  lastMessage: string;

  lastSenderId: ObjectId;

  recipients: IRecipient[];

  meta: any;

  createdAt: Date;

  updatedAt: Date;

  streamId: ObjectId;

  performerId: ObjectId;
}

export class PerformerConversationModel extends Document {
  type: string;

  name: string;

  lastMessage: string;

  lastSenderId: ObjectId;

  recipients: IRecipient[];

  meta: any;

  createdAt: Date;

  updatedAt: Date;

  streamId: ObjectId;

  performerId: ObjectId;
}
