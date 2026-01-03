import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanyIntroDto } from './create-company-intro.dto';

export class UpdateCompanyIntroDto extends PartialType(CreateCompanyIntroDto) {}
