import { Module, forwardRef } from '@nestjs/common';
import {
  SearchService
} from './services/search.service';
import {
  SearchController
} from './controllers/search.controller';
import { PerformerModule } from '../performer/performer.module';
import { PerformerAssetsModule } from '../performer-assets/performer-assets.module';
import { BlockModule } from '../block/block.module';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [
    forwardRef(() => PerformerModule),
    forwardRef(() => PerformerAssetsModule),
    forwardRef(() => BlockModule),
    forwardRef(() => UtilsModule)
  ],
  providers: [SearchService],
  controllers: [SearchController]
})
export class SearchModule {}
