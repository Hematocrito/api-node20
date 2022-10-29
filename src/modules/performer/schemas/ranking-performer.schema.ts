import * as mongoose from 'mongoose';

export const RankingPerformerSchema = new mongoose.Schema({
  performerId: {
    type: mongoose.Schema.Types.ObjectId
  },
  ordering: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
