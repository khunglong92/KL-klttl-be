import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import dayjs from 'dayjs';
import { UsersService } from '../users/users.service';

class LoginResponse {
  access_token: string;
  refresh_token: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  /**
   * Đăng nhập người dùng
   * @param body - Thông tin đăng nhập (email và mật khẩu)
   * @returns Trả về access token nếu đăng nhập thành công
   */
  @Post('login')
  @ApiOperation({
    summary: 'Đăng nhập',
    description: 'Xác thực thông tin đăng nhập và trả về JWT token',
  })
  @ApiBody({
    type: LoginDto,
    description: 'Thông tin đăng nhập',
    examples: {
      login: {
        value: {
          email: 'thienlocadmin@gmail.com',
          password: '123123123',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Đăng nhập thành công',
    type: LoginResponse,
  })
  @ApiBadRequestResponse({
    description: 'Thông tin không hợp lệ',
    schema: {
      example: {
        message: ['email must be an email', 'password should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Sai thông tin đăng nhập',
    schema: {
      example: {
        message: 'Email hoặc mật khẩu chưa đúng',
        error: 'Unauthorized',
        statusCode: 401,
      },
    },
  })
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    return this.authService.login(user);
  }

  /**
   * Đăng ký tài khoản mới
   * @param body - Thông tin đăng ký (email, mật khẩu, tên)
   * @returns Trả về thông tin tài khoản mới nếu đăng ký thành công
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Đăng ký tài khoản mới',
    description:
      'Tạo tài khoản người dùng mới, hash password và gửi email chào mừng.',
  })
  @ApiBody({
    type: RegisterDto,
    examples: {
      normalUser: {
        summary: 'Đăng ký tài khoản USER',
        value: {
          email: 'thienlocadmin@gmail.com',
          name: 'Thiên Lộc Admin',
          password: '123123123',
          role: 'ADMIN',
          dateOfBirth: dayjs().toDate(),
          avtUrl: 'https://picsum.photos/id/103/200/300',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Đăng ký thành công',
    schema: {
      example: {
        id: 1,
        email: 'thienlocadmin@gmail.com',
        name: 'Thiên Lộc Admin',
        role: 'USER',
        createdAt: '2025-11-02T15:30:00.000Z',
        updatedAt: '2025-11-02T15:30:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Dữ liệu không hợp lệ',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'email must be an email',
          'name should not be empty',
          'password must be longer than or equal to 6 characters',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiConflictResponse({
    description: 'Email đã được sử dụng',
    schema: {
      example: {
        statusCode: 400,
        message: 'Email đã được sử dụng',
        error: 'Bad Request',
      },
    },
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Refresh token
   * @returns access_token và refresh_token mới
   */
  @Post('refresh')
  @ApiOperation({
    summary: 'Lấy cặp token mới',
    description:
      'Nhận refresh_token và trả về access_token mới cùng refresh_token mới. Dùng khi access_token hết hạn.',
  })
  @ApiBody({
    type: RefreshTokenDto,
    description: 'Refresh token hợp lệ nhận được từ bước đăng nhập',
    examples: {
      sample: {
        summary: 'Ví dụ request',
        value: {
          refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy cặp token mới thành công',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token không hợp lệ hoặc đã hết hạn',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid refresh token',
        error: 'Unauthorized',
      },
    },
  })
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refresh_token);
  }
}
