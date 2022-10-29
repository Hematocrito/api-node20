import { Injectable, Inject, HttpException } from '@nestjs/common';
import { Model } from 'mongoose';
import { PerformerDto } from '../dtos';
import { PerformerModel, RankingPerformerModel } from '../models';
import { PERFORMER_MODEL_PROVIDER } from '../providers';
import { RANKING_PERFORMER_MODEL_PROVIDER } from '../providers/ranking-performer.provider';

@Injectable()
export class RankingPerformerService {
  constructor(
    @Inject(RANKING_PERFORMER_MODEL_PROVIDER)
    private readonly RankingPerformer: Model<RankingPerformerModel>,
    @Inject(PERFORMER_MODEL_PROVIDER)
    private readonly Performer: Model<PerformerModel>
  ) {}

  public async create(payload) {
    const item = await this.RankingPerformer.findOne({ performerId: payload.performerId });
    if (item) throw new HttpException('Performer is in the list already', 409);
    await this.RankingPerformer.create({
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  public async update(id, payload) {
    await this.RankingPerformer.updateOne({ _id: id }, {
      $set: {
        ...payload
      }
    });
  }

  public async delete(id) {
    return this.RankingPerformer.deleteOne({ _id: id });
  }

  public async getAll() {
    const items = await this.RankingPerformer.find({});
    const ids = items.map((i) => i.performerId);
    const performers = await this.Performer.find({
      _id: {
        $in: ids
      }
    });
    return performers.map((p) => {
      const item = new PerformerDto(p).toSearchResponse();
      const ordering = items.find((i) => i.performerId.toString() === p._id.toString());
      return {
        ...item,
        performerId: item._id,
        _id: ordering._id,
        ordering: ordering?.ordering || 0
      };
    }).sort((a, b) => (a.ordering > b.ordering ? 1 : -1));
  }
}
