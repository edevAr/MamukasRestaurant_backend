import { IsUUID, IsNumber, Min, IsOptional, IsDateString } from 'class-validator';

export class ReserveMenuDto {
  @IsUUID()
  menuId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsDateString()
  @IsOptional()
  reservationDate?: string; // Fecha para la reserva del menú
}

