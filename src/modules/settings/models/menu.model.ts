import { Document } from 'mongoose';

export class MenuModel extends Document {
  title: string;

  path: string;

  internal: boolean;

  parentId: string;

  help: string;

  section: string;

  public: boolean;

  ordering: number;

  isNewTab: boolean;

  createdAt: Date;

  updatedAt: Date;
}
