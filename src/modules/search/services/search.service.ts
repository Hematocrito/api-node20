import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { STATUS } from 'src/kernel/constants';
import {
  PERFORMER_GALLERY_MODEL_PROVIDER, PERFORMER_PRODUCT_MODEL_PROVIDER, PERFORMER_VIDEO_MODEL_PROVIDER
} from 'src/modules/performer-assets/providers';
import {
  GalleryModel, ProductModel, VideoModel
} from 'src/modules/performer-assets/models';
import { PerformerBlockService } from 'src/modules/block/services';
import { PERFORMER_MODEL_PROVIDER } from '../../performer/providers';
import { PerformerModel } from '../../performer/models';
import { SearchPayload } from '../payloads';

@Injectable()
export class SearchService {
  constructor(
    @Inject(forwardRef(() => PerformerBlockService))
    private readonly performerBlockService: PerformerBlockService,
    @Inject(PERFORMER_GALLERY_MODEL_PROVIDER)
    private readonly galleryModel: Model<GalleryModel>,
    @Inject(PERFORMER_PRODUCT_MODEL_PROVIDER)
    private readonly productModel: Model<ProductModel>,
    @Inject(PERFORMER_VIDEO_MODEL_PROVIDER)
    private readonly videoModel: Model<VideoModel>,
    @Inject(PERFORMER_MODEL_PROVIDER)
    private readonly performerModel: Model<PerformerModel>
  ) { }

  public async countTotal(req: SearchPayload, countryCode: string): Promise<any> {
    const query = {
      status: STATUS.ACTIVE
    } as any;
    if (req.q) {
      const searchValue = { $regex: new RegExp(req.q.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ''), 'i') };
      query.$or = [
        { name: searchValue },
        { username: searchValue },
        { title: searchValue },
        { tags: { $elemMatch: searchValue } }
      ];
    }
    if (countryCode) {
      const blockCountries = await this.performerBlockService.findBlockCountriesByQuery({ countryCodes: { $in: [countryCode] } });
      const performerIds = blockCountries.map((b) => b.sourceId);
      if (performerIds.length > 0) {
        query._id = { $nin: performerIds };
      }
    }
    const [totalPerformers, totalVideos, totalGalleries, totalProducts] = await Promise.all([
      this.performerModel.countDocuments(query),
      this.videoModel.countDocuments(query),
      this.galleryModel.countDocuments(query),
      this.productModel.countDocuments(query)
    ]);

    return {
      totalPerformers, totalVideos, totalGalleries, totalProducts
    };
  }
}
