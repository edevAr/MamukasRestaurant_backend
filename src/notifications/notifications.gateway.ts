import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from '../restaurants/entities/restaurant.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(Restaurant)
    private restaurantsRepository: Repository<Restaurant>,
  ) {}

  afterInit(server: Server) {
    this.server = server;
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      this.connectedUsers.set(client.id, payload.sub);
      client.join(`user:${payload.sub}`);
      
      if (payload.role === 'owner') {
        // Buscar el restaurante del owner para unirlo a la sala correcta
        const restaurant = await this.restaurantsRepository.findOne({
          where: { ownerId: payload.sub },
          select: ['id'],
        });
        
        if (restaurant) {
          // Unir al owner a la sala de su restaurante usando el restaurantId
          const room = `restaurant:${restaurant.id}`;
          client.join(room);
          console.log(`👤 Owner ${payload.sub} unido a sala ${room}`);
        } else {
          console.log(`⚠️  No se encontró restaurante para owner ${payload.sub}`);
        }
      }
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
  }

  // Allow clients to join restaurant rooms
  @SubscribeMessage('restaurant:join')
  async handleJoinRestaurant(client: Socket, data: { restaurantId: string }) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) {
      return { error: 'Not authenticated' };
    }

    const room = `restaurant:${data.restaurantId}`;
    client.join(room);
    console.log(`👤 Cliente ${userId} unido a sala ${room}`);
    
    return { success: true, room };
  }

  // Allow clients to leave restaurant rooms
  @SubscribeMessage('restaurant:leave')
  async handleLeaveRestaurant(client: Socket, data: { restaurantId: string }) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) {
      return { error: 'Not authenticated' };
    }

    const room = `restaurant:${data.restaurantId}`;
    client.leave(room);
    console.log(`👤 Cliente ${userId} salió de sala ${room}`);
    
    return { success: true };
  }

  // Notify restaurant opening/closing
  notifyRestaurantStatus(restaurantId: string, isOpen: boolean, message: string) {
    if (!this.server) {
      return;
    }

    const eventData = {
      restaurantId,
      isOpen,
      message,
      timestamp: new Date(),
    };
    
    // Emit to ALL connected clients
    this.server.emit('restaurant:status', eventData);
  }

  // Notify menu availability
  notifyMenuAvailability(restaurantId: string, menuId: string, available: boolean) {
    this.server.to(`restaurant:${restaurantId}`).emit('menu:availability', {
      restaurantId,
      menuId,
      available,
      timestamp: new Date(),
    });
  }

  // Notify new order
  notifyNewOrder(restaurantId: string, order: any) {
    this.server.to(`restaurant:${restaurantId}`).emit('order:new', {
      order,
      timestamp: new Date(),
    });
  }

  // Notify order status update
  notifyOrderStatus(userId: string, orderId: string, status: string) {
    this.server.to(`user:${userId}`).emit('order:status', {
      orderId,
      status,
      timestamp: new Date(),
    });
  }

  // Notify new reservation to restaurant owner
  notifyNewReservation(restaurantId: string, reservation: any) {
    const room = `restaurant:${restaurantId}`;
    const socketsInRoom = this.server.sockets.adapter.rooms.get(room);
    const clientCount = socketsInRoom ? socketsInRoom.size : 0;
    
    console.log(`📡 Emitiendo reservation:new a sala ${room} (${clientCount} cliente(s) conectado(s))`);
    console.log(`📅 Datos de la reserva:`, {
      id: reservation.id,
      restaurantId: reservation.restaurantId,
      client: reservation.client?.firstName + ' ' + reservation.client?.lastName,
      date: reservation.date,
      reservationType: reservation.reservationType,
    });
    
    this.server.to(room).emit('reservation:new', {
      reservation,
      timestamp: new Date(),
    });
  }

  // Notify reservation update
  notifyReservation(userId: string, reservation: any) {
    this.server.to(`user:${userId}`).emit('reservation:update', {
      reservation,
      timestamp: new Date(),
    });
  }

  // General notification
  sendNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date(),
    });
  }

  // Broadcast announcement to all users
  broadcastAnnouncement(announcement: any) {
    if (!this.server) {
      return;
    }

    console.log(`📢 Broadcasting announcement to all users: ${announcement.title}`);
    
    // Emit to all connected users
    this.server.emit('announcement:new', {
      announcement,
      timestamp: new Date(),
    });
  }
}

