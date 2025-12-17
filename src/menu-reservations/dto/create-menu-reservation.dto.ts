import { IsUUID, IsNumber, Min, IsDateString } from 'class-validator';

export class CreateMenuReservationDto {
  @IsUUID()
  menuId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsDateString()
  date: string; // Fecha para la cual se reserva el menú
}

