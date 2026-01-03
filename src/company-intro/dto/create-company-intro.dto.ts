import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateCompanyIntroDto {
  @IsString()
  url: string; // MinIO key (e.g., 'company-intros/filename.jpg')

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  subDescription?: string;

  @IsOptional()
  @IsInt()
  orderIndex?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
