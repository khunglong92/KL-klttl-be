import { Module } from '@nestjs/common';
import { PriceQuotesService } from './price-quotes.service';
import { PriceQuotesController } from './price-quotes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MinioModule } from '../minio/minio.module';

@Module({
  imports: [PrismaModule, MinioModule],
  controllers: [PriceQuotesController],
  providers: [PriceQuotesService],
  exports: [PriceQuotesService],
})
export class PriceQuotesModule {}
