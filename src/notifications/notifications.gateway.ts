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
        client.join(`restaurant:${payload.sub}`);
      }
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
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
}

