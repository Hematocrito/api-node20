import { Test, TestingModule } from '@nestjs/testing';
import { AstropayPaymentsController } from './astropay-payments.controller';

describe('AstropayPaymentsController', () => {
  let controller: AstropayPaymentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AstropayPaymentsController],
    }).compile();

    controller = module.get<AstropayPaymentsController>(AstropayPaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
