import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com', // Hoặc host SMTP của bạn
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER, // Gmail / mail server user
          pass: process.env.SMTP_PASS, // App password (Gmail không dùng password thường)
        },
        tls: {
          rejectUnauthorized: false, // Only for development
        },
      },
      defaults: {
        from: '"Thiên Lộc" <no-reply@thienloc.vn>',
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
