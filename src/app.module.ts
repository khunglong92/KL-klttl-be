import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { UploadModule } from './upload/upload.module';
import { ForceDeleteController } from './admin/force-delete.controller';
import { ServicesModule } from './services/services.module';
import { ProductCategoriesModule } from './product-categories/product-categories.module';
import { ProjectsModule } from './projects/projects.module';
import { PrismaModule } from './prisma/prisma.module';
import { ContactsModule } from './contacts/contacts.module';
import { ContactInfoModule } from './contact-info/contact-info.module';
import { QuotesModule } from './quotes/quotes.module';
import { MinioModule } from './minio/minio.module';

import { CompanyIntroModule } from './company-intro/company-intro.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NewsModule } from './news/news.module';
import { RecruitmentModule } from './recruitment/recruitment.module';
import { PriceQuotesModule } from './price-quotes/price-quotes.module';
import { StatisticsModule } from './statistics/statistics.module';
import { AiChatModule } from './ai-chat/ai-chat.module';

@Module({
  imports: [
    PrismaModule,
    MinioModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    UploadModule,
    ServicesModule,
    ProductCategoriesModule,
    ProjectsModule,
    ContactsModule,
    ContactInfoModule,
    QuotesModule,
    CompanyIntroModule,
    ReviewsModule,
    NewsModule,
    RecruitmentModule,
    PriceQuotesModule,
    StatisticsModule,
    AiChatModule,
  ],
  controllers: [AppController, ForceDeleteController],
  providers: [AppService],
})
export class AppModule {}
