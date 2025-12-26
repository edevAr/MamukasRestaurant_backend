import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import type { RedisClientOptions } from 'redis';
import { redisStore } from 'cache-manager-redis-store';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { MenusModule } from './menus/menus.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ReservationsModule } from './reservations/reservations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PromotionsModule } from './promotions/promotions.module';
import { MenuReservationsModule } from './menu-reservations/menu-reservations.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { EventsModule } from './events/events.module';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Redis Cache (Optional - falls back to in-memory if Redis is not available)
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get('REDIS_HOST');
        const redisPort = configService.get('REDIS_PORT');
        
        // If Redis is configured, use it; otherwise use in-memory cache
        if (redisHost && redisPort) {
          try {
            const store = await redisStore({
              socket: {
                host: redisHost,
                port: parseInt(redisPort as string),
              },
            } as RedisClientOptions);
            
            return {
              store: store as any,
              ttl: 300, // 5 minutes default
            };
          } catch (error) {
            console.warn('Redis connection failed, using in-memory cache:', error);
            return {
              ttl: 300,
            };
          }
        }
        
        // Fallback to in-memory cache
        return {
          ttl: 300,
        };
      },
      inject: [ConfigService],
      isGlobal: true,
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Schedule Module for Cron Jobs
    ScheduleModule.forRoot(),

    // Feature Modules
    AuthModule,
    UsersModule,
    RestaurantsModule,
    MenusModule,
    OrdersModule,
    ReviewsModule,
    ReservationsModule,
    NotificationsModule,
    AnalyticsModule,
    PromotionsModule,
    MenuReservationsModule,
    AnnouncementsModule,
    EventsModule,
    SalesModule,
  ],
})
export class AppModule {}

