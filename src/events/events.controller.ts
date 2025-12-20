import { Controller, Get, Query, Request, Res, Headers } from '@nestjs/common';
import { Response } from 'express';
import { EventsService } from './events.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Public } from '../common/decorators/public.decorator';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    @InjectRepository(Restaurant)
    private restaurantsRepository: Repository<Restaurant>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Get('stream')
  async streamEvents(
    @Request() req,
    @Res() res: Response,
    @Query('token') token?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    // Set headers for SSE first (before any authentication checks)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS for SSE
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Authenticate via token query param or Authorization header (SSE doesn't support custom headers easily)
    // Allow unauthenticated connections for public events (like restaurant status)
    let userId: string | null = null;
    let userRole: string | null = null;
    let staffRole: string | null = null;
    let restaurantIdFromUser: string | null = null;
    
    const authToken = token || authHeader?.replace('Bearer ', '');
    if (authToken) {
      try {
        const payload = await this.jwtService.verifyAsync(authToken);
        userId = payload.sub;
        userRole = payload.role;
        staffRole = payload.staffRole || null;
        restaurantIdFromUser = payload.restaurantId || null;
        console.log(`✅ Authenticated SSE connection: userId=${userId}, role=${userRole}, staffRole=${staffRole}, restaurantId=${restaurantIdFromUser}`);
      } catch (error) {
        // If token is invalid, allow connection but as unauthenticated user
        console.log('⚠️ Invalid token, connecting as unauthenticated user');
      }
    } else {
      console.log('ℹ️ No token provided, connecting as unauthenticated user for public events');
    }

    // Determine which events to subscribe to
    let restaurantIdToListen: string | null = restaurantIdFromUser;

    if (!restaurantIdToListen && userRole === 'owner' && userId) {
      // Find owner's restaurant
      const restaurant = await this.restaurantsRepository.findOne({
        where: { ownerId: userId },
        select: ['id'],
      });
      if (restaurant) {
        restaurantIdToListen = restaurant.id;
      }
    }

    // Subscribe to events (allow unauthenticated users for public events)
    const subscription = this.eventsService.subscribe(
      userId || 'anonymous',
      userRole || 'client', // Default to 'client' for unauthenticated users
      restaurantIdToListen,
      (event) => {
        // Send event to client
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      },
      staffRole || undefined,
    );

    // Handle client disconnect
    req.on('close', () => {
      this.eventsService.unsubscribe(subscription.id);
      res.end();
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`);
  }
}
