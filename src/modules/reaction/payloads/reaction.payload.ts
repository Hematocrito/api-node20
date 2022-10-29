import {
  IsString, IsOptional, IsNotEmpty, IsIn
} from 'class-validator';
import { REACTION, REACTION_TYPE } from '../constants';

export class ReactionCreatePayload {
  @IsString()
  @IsOptional()
  @IsIn([
    REACTION_TYPE.VIDEO,
    REACTION_TYPE.PERFORMER,
    REACTION_TYPE.COMMENT,
    REACTION_TYPE.GALLERY,
    REACTION_TYPE.PRODUCT
  ])
  objectType = REACTION_TYPE.VIDEO;

  @IsString()
  @IsOptional()
  @IsIn([
    REACTION.LIKE,
    REACTION.FAVOURITE,
    REACTION.WATCH_LATER
  ])
  action: string;

  @IsString()
  @IsNotEmpty()
  objectId: string;
}
