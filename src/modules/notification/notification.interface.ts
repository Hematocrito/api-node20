import { ObjectId } from 'mongodb';

export type NotificationType = 'performer' | 'video';

export type NotificationAction = 'like';

export interface CreateNotificationOptions {
  userId: string | ObjectId;
  type: string;
  action: string,
  createdBy: string | ObjectId;
  refId: ObjectId;
  title?: string;
  message?: string;
  thumbnail?: string;
  read?: boolean;
}
