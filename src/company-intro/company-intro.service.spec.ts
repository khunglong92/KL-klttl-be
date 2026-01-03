import { Test, TestingModule } from '@nestjs/testing';
import { CompanyIntroService } from './company-intro.service';

describe('CompanyIntroService', () => {
  let service: CompanyIntroService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanyIntroService],
    }).compile();

    service = module.get<CompanyIntroService>(CompanyIntroService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
