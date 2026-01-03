import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendWelcomeEmail(
    email: string,
    name: string,
    verificationToken?: string,
  ) {
    const year = new Date().getFullYear();
    const appName = 'Thiên Lộc';
    console.log('verificationToken', verificationToken);

    const verificationLink = verificationToken
      ? `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`
      : '#';
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Chào mừng đến với ${appName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        body { margin: 0; padding: 0; font-family: 'Roboto', Arial, sans-serif; line-height: 1.6; color: #333333; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background-color: #1890ff; padding: 30px 20px; text-align: center; }
        .logo { max-width: 150px; height: auto; }
        .content { padding: 30px 20px; background-color: #ffffff; }
        .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666666; }
        .button {
          display: inline-block;
          padding: 12px 30px;
          margin: 20px 0;
          background-color: #1890ff;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 500;
        }
        .divider { border-top: 1px solid #eaeaea; margin: 25px 0; }
        .social-icons { margin: 20px 0; }
        .social-icons a { margin: 0 10px; text-decoration: none; }
        @media screen and (max-width: 600px) {
          .container { width: 100% !important; }
          .content { padding: 20px 15px !important; }
          .button { width: 100%; text-align: center; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Roboto', Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f5f5f5;">
      <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div class="header" style="background-color: #1890ff; padding: 30px 20px; text-align: center;">
          <img src="https://thienloc.vn/logo.png" alt="${appName} Logo" class="logo" style="max-width: 150px; height: auto;">
        </div>
        
        <!-- Content -->
        <div class="content" style="padding: 30px 20px; background-color: #ffffff;">
          <h1 style="color: #333333; margin-top: 0;">Chào mừng ${name} đến với ${appName}!</h1>
          
          <p>Xin chân thành cảm ơn bạn đã đăng ký tài khoản tại ${appName}. Chúng tôi rất vui mừng được chào đón bạn trở thành thành viên của cộng đồng chúng tôi.</p>
          
          <p>Tại ${appName}, chúng tôi cam kết mang đến cho bạn những trải nghiệm tốt nhất với:</p>
          <ul>
            <li>Sản phẩm chất lượng cao</li>
            <li>Dịch vụ chuyên nghiệp</li>
            <li>Hỗ trợ khách hàng 24/7</li>
            <li>Nhiều ưu đãi hấp dẫn</li>
          </ul>
          
         <div style="text-align: center; margin: 20px 0;">
          <a href="${verificationLink}" 
            style="background-color: #28a745; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 4px; 
                    display: inline-block; 
                    font-weight: 500;
                    font-size: 16px;">
            Xác thực Email
          </a>
          <p style="color: #666; font-size: 13px; margin-top: 10px;">
            Hoặc sao chép đường dẫn: <br>
            <span style="word-break: break-all; color: #1890ff;">${verificationLink}</span>
          </p>
        </div>
          <div class="divider" style="border-top: 1px solid #eaeaea; margin: 25px 0;"></div>
          
          <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi qua email <a href="mailto:hotro@thienloc.vn" style="color: #1890ff; text-decoration: none;">hotro@thienloc.vn</a> hoặc số điện thoại <a href="tel:19001234" style="color: #1890ff; text-decoration: none;">1900 1234</a>.</p>
          
          <p>Trân trọng,<br>Đội ngũ ${appName}</p>
        </div>
        
        <!-- Footer -->
        <div class="footer" style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666666;">
          <p>© ${year} ${appName}. Tất cả các quyền được bảo lưu.</p>
          <div class="social-icons" style="margin: 20px 0;">
            <a href="https://facebook.com/thienloc" target="_blank" style="margin: 0 10px; text-decoration: none;">
              <img src="https://thienloc.vn/icons/facebook.png" alt="Facebook" width="24">
            </a>
            <a href="https://zalo.me/thienloc" target="_blank" style="margin: 0 10px; text-decoration: none;">
              <img src="https://thienloc.vn/icons/zalo.png" alt="Zalo" width="24">
            </a>
            <a href="https://youtube.com/thienloc" target="_blank" style="margin: 0 10px; text-decoration: none;">
              <img src="https://thienloc.vn/icons/youtube.png" alt="YouTube" width="24">
            </a>
          </div>
          <p>Địa chỉ: 123 Đường ABC, Quận 1, TP. Hồ Chí Minh</p>
          <p>Bạn nhận được email này vì đã đăng ký tài khoản tại ${appName}. Nếu không phải bạn, vui lòng bỏ qua email này.</p>
          <p><a href="#" style="color: #666666; text-decoration: none;">Hủy đăng ký</a> | <a href="#" style="color: #666666; text-decoration: none;">Chính sách bảo mật</a></p>
        </div>
      </div>
    </body>
    </html>
    `;

    try {
      await Promise.race([
        this.mailerService.sendMail({
          to: email,
          subject: 'Chào mừng bạn đến với Thiên Lộc',
          html: html,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Email sending timeout')), 5000),
        ),
      ]);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }
}
