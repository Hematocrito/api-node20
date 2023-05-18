import { Schema } from 'mongoose';

const schema = new Schema({
  type: {
    type: String,
    index: true
  },
  name: String,
  lastMessage: String,
  lastSenderId: Schema.Types.ObjectId,
  lastMessageCreatedAt: Date,
  recipients: [{
    _id: false,
    source: String,
    sourceId: Schema.Types.ObjectId
  }],
  meta: Schema.Types.Mixed,
  streamId: Schema.Types.ObjectId,
  performerId: Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

schema.index({ recipients: 1 });

const userSchema = new Schema({
  type: {
    type: String,
    index: true
  },
  name: String,
  lastMessage: String,
  lastSenderId: Schema.Types.ObjectId,
  lastMessageCreatedAt: Date,
  recipients: [{
    _id: false,
    source: String,
    sourceId: Schema.Types.ObjectId
  }],
  meta: Schema.Types.Mixed,
  streamId: Schema.Types.ObjectId,
  performerId: Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.index({ recipients: 1 });

const performerSchema = new Schema({
  type: {
    type: String,
    index: true
  },
  name: String,
  lastMessage: String,
  lastSenderId: Schema.Types.ObjectId,
  lastMessageCreatedAt: Date,
  recipients: [{
    _id: false,
    source: String,
    sourceId: Schema.Types.ObjectId
  }],
  meta: Schema.Types.Mixed,
  streamId: Schema.Types.ObjectId,
  performerId: Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

performerSchema.index({ recipients: 1 });

export const ConversationSchema = schema;
export const ConversationSchemaUsers = userSchema;
export const ConversationSchemaPerformers = performerSchema;
