import { Injectable } from '@nestjs/common';

interface EventSubscription {
  id: string;
  userId: string;
  userRole: string;
  staffRole?: string;
  restaurantId: string | null;
  callback: (event: any) => void;
}

@Injectable()
export class EventsService {
  private subscriptions = new Map<string, EventSubscription>();

  subscribe(
    userId: string,
    userRole: string,
    restaurantId: string | null,
    callback: (event: any) => void,
    staffRole?: string,
  ): EventSubscription {
    const id = `${userId}-${Date.now()}-${Math.random()}`;
    const subscription: EventSubscription = {
      id,
      userId,
      userRole,
      staffRole,
      restaurantId,
      callback,
    };

    this.subscriptions.set(id, subscription);
    return subscription;
  }

  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  // Emit restaurant status change to all clients (including unauthenticated)
  emitRestaurantStatus(restaurantId: string, isOpen: boolean, message: string): void {
    const event = {
      type: 'restaurant:status',
      data: {
        restaurantId,
        isOpen,
        message,
        timestamp: new Date().toISOString(),
      },
    };

    console.log(`📡 Emitting restaurant:status event to ${this.subscriptions.size} subscriptions`);
    
    // Send to all subscriptions (clients and unauthenticated users)
    let sentCount = 0;
    this.subscriptions.forEach((sub) => {
      // Send to all client subscriptions (including unauthenticated users with role 'client')
      if (sub.userRole === 'client') {
        try {
          sub.callback(event);
          sentCount++;
        } catch (error) {
          console.error(`Error sending event to subscription ${sub.id}:`, error);
        }
      }
    });
    
    console.log(`✅ Event sent to ${sentCount} client(s)`);
  }

  // Emit new reservation to restaurant owner
  emitNewReservation(restaurantId: string, reservation: any): void {
    const event = {
      type: 'reservation:new',
      data: {
        reservation,
        timestamp: new Date().toISOString(),
      },
    };

    // Send to owner of the restaurant
    this.subscriptions.forEach((sub) => {
      if (sub.userRole === 'owner' && sub.restaurantId === restaurantId) {
        try {
          sub.callback(event);
        } catch (error) {
          console.error(`Error sending event to subscription ${sub.id}:`, error);
        }
      }
    });
  }

  // Emit reservation update
  emitReservationUpdate(userId: string, reservation: any): void {
    const event = {
      type: 'reservation:update',
      data: {
        reservation,
        timestamp: new Date().toISOString(),
      },
    };

    // Send to specific user
    this.subscriptions.forEach((sub) => {
      if (sub.userId === userId) {
        try {
          sub.callback(event);
        } catch (error) {
          console.error(`Error sending event to subscription ${sub.id}:`, error);
        }
      }
    });
  }

  // Emit new sale to kitchen (cooks)
  emitNewSale(restaurantId: string, sale: any): void {
    const event = {
      type: 'sale:new',
      data: {
        sale,
        timestamp: new Date().toISOString(),
      },
    };

    // Send to cooks and waiters of the restaurant
    this.subscriptions.forEach((sub) => {
      if (sub.restaurantId === restaurantId && 
          (sub.userRole === 'owner' || sub.staffRole === 'cook' || sub.staffRole === 'waiter' || sub.staffRole === 'administrator' || sub.staffRole === 'manager')) {
        try {
          sub.callback(event);
        } catch (error) {
          console.error(`Error sending event to subscription ${sub.id}:`, error);
        }
      }
    });
  }

  // Emit sale update
  emitSaleUpdate(restaurantId: string, sale: any): void {
    const event = {
      type: 'sale:update',
      data: {
        sale,
        timestamp: new Date().toISOString(),
      },
    };

    // Send to all staff of the restaurant
    this.subscriptions.forEach((sub) => {
      if (sub.restaurantId === restaurantId) {
        try {
          sub.callback(event);
        } catch (error) {
          console.error(`Error sending event to subscription ${sub.id}:`, error);
        }
      }
    });
  }
}
