import { PartialType } from '@nestjs/mapped-types';
import { CreateMenuDto } from './create-menu.dto';
import { IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class UpdateMenuDto extends PartialType(CreateMenuDto) {
  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  totalSold?: number;
}

