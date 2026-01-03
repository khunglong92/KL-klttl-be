import { Test, TestingModule } from '@nestjs/testing';
import { CompanyIntroController } from './company-intro.controller';

describe('CompanyIntroController', () => {
  let controller: CompanyIntroController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyIntroController],
    }).compile();

    controller = module.get<CompanyIntroController>(CompanyIntroController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
