import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantStatusCronService } from './restaurant-status-cron.service';
import { Restaurant } from './entities/restaurant.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Restaurant]),
    NotificationsModule,
    EventsModule,
  ],
  controllers: [RestaurantsController],
  providers: [RestaurantsService, RestaurantStatusCronService],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}

