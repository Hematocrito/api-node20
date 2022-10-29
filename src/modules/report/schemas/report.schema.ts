import * as mongoose from 'mongoose';
import { REPORT_TARGET, REPORT_STATUSES } from '../constants';

export const ReportSchema = new mongoose.Schema({
  title: String,
  description: String,
  source: {
    type: String,
    default: 'user',
    index: true
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  performerId: {
    type: mongoose.Schema.Types.ObjectId
  },
  target: {
    type: String,
    default: REPORT_TARGET.VIDEO,
    index: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId
  },
  status: {
    type: String,
    default: REPORT_STATUSES.REPORTED
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
