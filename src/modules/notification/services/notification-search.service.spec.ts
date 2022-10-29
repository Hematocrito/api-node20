import { Test, TestingModule } from '@nestjs/testing';
import { NotificationSearchService } from './notification-search.service';

describe('NotificationSearchService', () => {
  let service: NotificationSearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationSearchService]
    }).compile();

    service = module.get<NotificationSearchService>(NotificationSearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
