import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SaleStatus } from '../entities/sale.entity';

export class UpdateSaleStatusDto {
  @IsEnum(SaleStatus)
  status: SaleStatus;
}

export class UpdateSaleItemStatusDto {
  @IsString()
  saleItemId: string;

  @IsOptional()
  @IsString()
  status?: string;
}
