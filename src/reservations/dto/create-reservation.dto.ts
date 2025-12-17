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
  time: string;

  @IsNumber()
  @Min(1)
  numberOfGuests: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  restaurantId: string;
}

