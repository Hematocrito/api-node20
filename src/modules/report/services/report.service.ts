import {
  Injectable, Inject, forwardRef, HttpException, ForbiddenException
} from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData, EntityNotFoundException } from 'src/kernel';
import { uniq } from 'lodash';
import { PerformerDto } from 'src/modules/performer/dtos';
import { VideoService } from 'src/modules/performer-assets/services';
import { VideoDto } from 'src/modules/performer-assets/dtos';
import { MailerService } from 'src/modules/mailer';
import { ReportModel } from '../models/report.model';
import { REPORT_MODEL_PROVIDER } from '../providers';
import {
  ReportSearchRequestPayload, ReportCreatePayload
} from '../payloads';
import { UserDto } from '../../user/dtos';
import { ReportDto } from '../dtos/report.dto';
import { UserService } from '../../user/services';
import { PerformerService } from '../../performer/services';
import { REPORT_STATUSES, REPORT_TARGET } from '../constants';

@Injectable()
export class ReportService {
  constructor(
    @Inject(forwardRef(() => VideoService))
    private readonly videoService: VideoService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(REPORT_MODEL_PROVIDER)
    private readonly reportModel: Model<ReportModel>,
    private readonly mailService: MailerService
  ) { }

  public async create(
    payload: ReportCreatePayload,
    user: UserDto
  ): Promise<ReportDto> {
    const existReport = await this.reportModel.findOne({
      target: payload.target,
      targetId: payload.targetId,
      sourceId: user._id
    });
    if (existReport) {
      existReport.title = payload.title;
      existReport.description = payload.description;
      existReport.updatedAt = new Date();
      await existReport.save();
      return existReport;
    }
    const data = { ...payload } as any;
    data.sourceId = user._id;
    data.source = 'user';
    data.createdAt = new Date();
    data.updatedAt = new Date();
    const newreport = await this.reportModel.create(data);
    return newreport;
  }

  public async rejectReport(id) {
    const report = await this.reportModel.findById(id);
    if (!report) throw new EntityNotFoundException();
    if (report.status !== REPORT_STATUSES.REPORTED) {
      throw new ForbiddenException();
    }
    report.status = REPORT_STATUSES.REJECTED;
    await report.save();
    return { success: true };
  }

  public async remove(id) {
    const report = await this.reportModel.findById(id);
    if (!report) {
      throw new EntityNotFoundException();
    }
    if (report.status === REPORT_STATUSES.DELETED) {
      throw new HttpException('Report object was deleted!', 422);
    }
    report.status = REPORT_STATUSES.DELETED;
    report.updatedAt = new Date();
    await report.save();
    if (report.target === REPORT_TARGET.VIDEO) {
      const [performer, video] = await Promise.all([
        this.performerService.findById(report.performerId),
        this.videoService.findById(report.targetId)
      ]);
      performer?.email && video && await this.mailService.send({
        subject: 'Video Violation',
        to: performer?.email,
        data: {
          videoTitle: video?.title
        },
        template: 'model-report-notify'
      });
      video && await this.videoService.delete(video._id);
    }

    return { deleted: true };
  }

  public async adminSearch(
    req: ReportSearchRequestPayload
  ): Promise<PageableData<ReportDto>> {
    const query = {} as any;
    if (req.sourceId) {
      query.sourceId = req.sourceId;
    }
    if (req.source) {
      query.source = req.source;
    }
    if (req.performerId) {
      query.performerId = req.performerId;
    }
    if (req.targetId) {
      query.targetId = req.targetId;
    }
    if (req.target) {
      query.target = req.target;
    }
    let sort = {
      createdAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.reportModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.reportModel.countDocuments(query)
    ]);
    const reports = data.map((d) => new ReportDto(d));
    const UIds = uniq(data.map((d) => d.sourceId));
    const performerIds = uniq(data.map((d) => d.performerId));
    const targetIds = uniq(data.map((d) => d.targetId));
    const [users, performers, videos] = await Promise.all([
      UIds.length ? this.userService.findByIds(UIds) : [],
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      targetIds.length ? this.videoService.findByIds(targetIds) : []
    ]);
    reports.forEach((report: ReportDto) => {
      const user = users.find(
        (u) => u._id.toString() === report.sourceId?.toString()
      );
      const performer = performers.find(
        (p) => p._id.toString() === report.performerId?.toString()
      );
      const video = videos.find(
        (v) => v._id.toString() === report.targetId?.toString()
      );
      // eslint-disable-next-line no-param-reassign
      report.sourceInfo = user ? new UserDto(user).toResponse() : null;
      // eslint-disable-next-line no-param-reassign
      report.performerInfo = performer ? new PerformerDto(performer).toResponse() : null;
      // eslint-disable-next-line no-param-reassign
      report.targetInfo = video ? new VideoDto(video) : null;
    });
    return {
      data: reports,
      total
    };
  }

  public async performerSearch(
    req: ReportSearchRequestPayload, user: UserDto
  ): Promise<PageableData<ReportDto>> {
    const query = {
      performerId: user._id
    } as any;
    if (req.sourceId) {
      query.sourceId = req.sourceId;
    }
    if (req.source) {
      query.source = req.source;
    }
    if (req.targetId) {
      query.targetId = req.targetId;
    }
    if (req.target) {
      query.target = req.target;
    }
    let sort = {
      createdAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.reportModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.reportModel.countDocuments(query)
    ]);
    const reports = data.map((d) => new ReportDto(d));
    const UIds = uniq(data.map((d) => d.sourceId));
    const performerIds = uniq(data.map((d) => d.performerId));
    const targetIds = uniq(data.map((d) => d.targetId));
    const [users, performers, videos] = await Promise.all([
      UIds.length ? this.userService.findByIds(UIds) : [],
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      targetIds.length ? this.videoService.findByIds(targetIds) : []
    ]);
    reports.forEach((report: ReportDto) => {
      const userInfo = users.find(
        (u) => u._id.toString() === report.sourceId?.toString()
      );
      const performer = performers.find(
        (p) => p._id.toString() === report.performerId?.toString()
      );
      const video = videos.find(
        (v) => v._id.toString() === report.targetId?.toString()
      );
      // eslint-disable-next-line no-param-reassign
      report.sourceInfo = userInfo ? new UserDto(userInfo).toResponse() : null;
      // eslint-disable-next-line no-param-reassign
      report.performerInfo = performer ? new PerformerDto(performer).toResponse() : null;
      // eslint-disable-next-line no-param-reassign
      report.targetInfo = video ? new VideoDto(video) : null;
    });
    return {
      data: reports,
      total
    };
  }
}
