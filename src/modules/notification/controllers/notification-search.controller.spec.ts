import { Test, TestingModule } from '@nestjs/testing';
import { NotificationSearchController } from './notification-search.controller';

describe('NotificationSearchController', () => {
  let controller: NotificationSearchController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationSearchController],
    }).compile();

    controller = module.get<NotificationSearchController>(NotificationSearchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
