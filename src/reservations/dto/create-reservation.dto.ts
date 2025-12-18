import {
  IsDateString,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateReservationDto {
  @IsDateString()
  date: string;

  @IsString()
  @IsOptional()
  time?: string; // Opcional si es para llevar

  @IsNumber()
  @Min(1)
  @IsOptional()
  numberOfGuests?: number; // Opcional si es para llevar

  @IsString()
  reservationType: string; // 'dine-in' o 'takeout'

  @IsOptional()
  menuItems?: Array<{
    menuId: string;
    name: string;
    quantity: number;
    price: number;
  }>;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  restaurantId: string;
}

