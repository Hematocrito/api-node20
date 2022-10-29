import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule } from 'src/kernel';
import { ReactionModule } from 'src/modules/reaction/reaction.module';
import { CommentController } from './controllers/comment.controller';
import { CommentService } from './services/comment.service';
import { commentProviders } from './providers/comment.provider';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { PerformerModule } from '../performer/performer.module';
import { PerformerAssetsModule } from '../performer-assets/performer-assets.module';
import { ReplyCommentListener, ReactionCommentListener } from './listeners';

@Module({
  imports: [
    MongoDBModule,
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => PerformerAssetsModule),
    forwardRef(() => ReactionModule)
  ],
  providers: [
    ...commentProviders,
    CommentService,
    ReplyCommentListener,
    ReactionCommentListener
  ],
  controllers: [
    CommentController
  ],
  exports: []
})
export class CommentModule {}
