import { PartialType } from '@nestjs/swagger';
import { CreateContactInfoDto } from './create-contact-info.dto';

export class UpdateContactInfoDto extends PartialType(CreateContactInfoDto) {}
