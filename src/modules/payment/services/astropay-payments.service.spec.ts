import { Test, TestingModule } from '@nestjs/testing';
import { AstropayPaymentsService } from './astropay-payments.service';

describe('AstropayPaymentsService', () => {
  let service: AstropayPaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AstropayPaymentsService],
    }).compile();

    service = module.get<AstropayPaymentsService>(AstropayPaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
