import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateContactInfoDto {
  @ApiProperty({
    description: 'Tên công ty',
    example: 'Công ty TNHH Kim Loại Tam Thiên Lộc',
  })
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @ApiProperty({
    description: 'Địa chỉ công ty',
    example: '123 Đường ABC, Quận 1, TP.HCM',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0123456789',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Email liên hệ',
    example: 'contact@company.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Giờ làm việc',
    example: 'Thứ 2 - Thứ 6: 8:00 - 17:00',
  })
  @IsNotEmpty()
  @IsString()
  workingHours: string;

  @ApiProperty({
    description: 'Google Map URL',
    example: 'https://maps.google.com/...',
    required: false,
  })
  @IsOptional()
  @IsString()
  googleMapUrl?: string;

  @ApiProperty({
    description: 'Ngày thành lập',
    example: '2023-11-15T10:00:00.000Z',
    required: false,
  })
  @IsOptional()
  foundingDate?: Date;

  @ApiProperty({
    description: 'Loại hình công ty',
    example: 'Công ty TNHH',
    required: false,
  })
  @IsOptional()
  @IsString()
  companyType?: string;

  @ApiProperty({
    description: 'Giới thiệu chung',
    example: 'Chúng tôi là công ty hàng đầu...',
    required: false,
  })
  @IsOptional()
  @IsString()
  aboutUs?: string;

  @ApiProperty({
    description: 'Số năm kinh nghiệm',
    example: 10,
    required: false,
  })
  @IsOptional()
  yearsOfExperience?: number;

  @ApiProperty({
    description: 'Số dự án hoàn thành',
    example: 100,
    required: false,
  })
  @IsOptional()
  projectsCompleted?: number;

  @ApiProperty({
    description: 'Số lượng khách hàng tin tưởng',
    example: 500,
    required: false,
  })
  @IsOptional()
  satisfiedClients?: number;

  @ApiProperty({
    description: 'Mức độ hài lòng (%)',
    example: 98,
    required: false,
  })
  @IsOptional()
  satisfactionRate?: number;

  @ApiProperty({
    description: 'Sứ mệnh',
    example: 'Mang lại giá trị tốt nhất cho khách hàng.',
    required: false,
  })
  @IsOptional()
  @IsString()
  mission?: string;

  @ApiProperty({
    description: 'Tầm nhìn',
    example: 'Trở thành tập đoàn hàng đầu trong lĩnh vực...',
    required: false,
  })
  @IsOptional()
  @IsString()
  vision?: string;

  @ApiProperty({
    description: 'Giới thiệu cơ sở vật chất',
    example: 'Công ty sở hữu hệ thống nhà xưởng hiện đại...',
    required: false,
  })
  @IsOptional()
  @IsString()
  facilitiesIntro?: string;

  @ApiProperty({
    description: 'Giới thiệu hồ sơ năng lực',
    example: 'Công ty có năng lực sản xuất và gia công...',
    required: false,
  })
  @IsOptional()
  @IsString()
  profileIntro?: string;

  @ApiProperty({
    description: 'Danh sách Giá trị cốt lõi (JSON)',
    example: '[{"icon":"Target","title":"Chính xác","description":"Mô tả"}]',
    required: false,
  })
  @IsOptional()
  @IsString()
  coreValuesItems?: string;

  @ApiProperty({
    description: 'Mô tả Giá trị cốt lõi (Rich Text)',
    example: 'Chính xác trong từng chi tiết...',
    required: false,
  })
  @IsOptional()
  @IsString()
  coreValuesDescription?: string;

  @ApiProperty({
    description: 'Danh sách Lĩnh vực ứng dụng (JSON)',
    example: '[{"icon":"Settings","title":"Cơ khí","description":"Mô tả"}]',
    required: false,
  })
  @IsOptional()
  @IsString()
  servicesItems?: string;

  @ApiProperty({
    description: 'Mô tả Lĩnh vực ứng dụng (Rich Text)',
    example: 'Ngành gia công kim loại tấm...',
    required: false,
  })
  @IsOptional()
  @IsString()
  servicesDescription?: string;

  @ApiProperty({
    description: 'Nội dung Cam kết của chúng tôi',
    example: 'Cam kết mang đến sản phẩm chất lượng...',
    required: false,
  })
  @IsOptional()
  @IsString()
  commitmentIntro?: string;
}
