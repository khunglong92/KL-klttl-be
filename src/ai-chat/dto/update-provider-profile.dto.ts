import { PartialType } from '@nestjs/swagger';
import { CreateProviderProfileDto } from './create-provider-profile.dto';

export class UpdateProviderProfileDto extends PartialType(
  CreateProviderProfileDto,
) {}
