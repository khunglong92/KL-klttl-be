import { JwtService, JwtSignOptions } from '@nestjs/jwt';

import { RegisterDto } from './dto/register.dto';
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  async validateUser(email: string, pass: string) {
    this.logger.debug(`Validate user start: email=${email}`);
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`Validate user failed: not found email=${email}`);
      throw new UnauthorizedException('Email hoặc mật khẩu chưa đúng');
    }

    const isValid = await this.usersService.validatePassword(
      pass,
      user.password,
    );
    this.logger.debug(
      `Password validation result for email=${email}: ${isValid ? 'OK' : 'FAILED'}`,
    );
    if (!isValid) {
      this.logger.warn(`Validate user failed: invalid password email=${email}`);
      throw new UnauthorizedException('Email hoặc mật khẩu chưa đúng');
    }

    // Trả về user (không trả password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    this.logger.log(`Validate user success: email=${email}`);
    return result;
  }

  login(user: { email: string }) {
    this.logger.log(`Login success, issuing token: email=${user.email}`);
    const payload = { sub: user.email, email: user.email };
    const accessExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const access_token = this.jwtService.sign(payload, {
      expiresIn: accessExpiresIn,
    } as JwtSignOptions);
    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: refreshExpiresIn,
    } as JwtSignOptions);
    return { access_token, refresh_token };
  }

  refresh(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify<{ sub: string; email: string }>(
        refreshToken,
        {
          secret: process.env.JWT_SECRET || 'dev_secret_unsecure',
        },
      );
      this.logger.log(`Refresh token verified for email=${decoded.email}`);
      // Issue new tokens
      const payload = { sub: decoded.sub, email: decoded.email };
      const accessExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
      const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
      const access_token = this.jwtService.sign(payload, {
        expiresIn: accessExpiresIn,
      } as JwtSignOptions);
      const refresh_token = this.jwtService.sign(payload, {
        expiresIn: refreshExpiresIn,
      } as JwtSignOptions);
      return { access_token, refresh_token };
    } catch (error) {
      this.logger.warn(
        `Invalid refresh token: ${(error as Error)?.message ?? 'unknown error'}`,
      );
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async register(dto: RegisterDto) {
    try {
      this.logger.debug(`Register start: email=${dto.email}`);
      const existing = await this.usersService.findByEmail(dto.email);
      if (existing) {
        this.logger.warn(
          `Register failed: email already used email=${dto.email}`,
        );
        throw new BadRequestException('Email đã được sử dụng');
      }

      const newUser = await this.usersService.createUser(
        dto.email,
        dto.password,
        dto.name,
        dto.role ?? UserRole.USER,
      );

      // Don't wait for email to be sent before responding
      this.mailService
        .sendWelcomeEmail(
          newUser.email,
          newUser.name,
          this.jwtService.sign({ sub: newUser.email }),
        )
        .catch((error) => {
          console.error('Failed to send welcome email:', error);
          // You might want to log this to a monitoring service
        });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = newUser;
      this.logger.log(`Register success: email=${dto.email}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Register error: email=${dto.email}`,
        (error as Error)?.stack as string,
      );
      throw error;
    }
  }
}
