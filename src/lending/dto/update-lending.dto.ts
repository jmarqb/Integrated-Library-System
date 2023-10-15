import { PartialType } from '@nestjs/swagger';
import { CreateLendingDto } from './create-lending.dto';

export class UpdateLendingDto extends PartialType(CreateLendingDto) {}
