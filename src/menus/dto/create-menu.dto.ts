import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { MenuItemType } from '../entities/menu.entity';

export class CreateMenuDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  price: number;

  @IsString()
  @IsOptional()
  image?: string;

  @IsEnum(MenuItemType)
  @IsOptional()
  type?: MenuItemType;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsDateString()
  date: string;

  @IsUUID()
  restaurantId: string;
}

