import { Module } from '@nestjs/common';
import { ContactInfoController } from './contact-info.controller';
import { ContactInfoService } from './contact-info.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContactInfoController],
  providers: [ContactInfoService],
  exports: [ContactInfoService],
})
export class ContactInfoModule {}
