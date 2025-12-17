import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuReservationsService } from './menu-reservations.service';
import { MenuReservationsController } from './menu-reservations.controller';
import { MenuReservation } from './entities/menu-reservation.entity';
import { MenusModule } from '../menus/menus.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MenuReservation]),
    MenusModule,
  ],
  controllers: [MenuReservationsController],
  providers: [MenuReservationsService],
  exports: [MenuReservationsService],
})
export class MenuReservationsModule {}

