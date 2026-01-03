import { Module } from '@nestjs/common';
import { CompanyIntroService } from './company-intro.service';
import { CompanyIntroController } from './company-intro.controller';
import { MinioModule } from '../minio/minio.module';

@Module({
  imports: [MinioModule],
  controllers: [CompanyIntroController],
  providers: [CompanyIntroService],
})
export class CompanyIntroModule {}
