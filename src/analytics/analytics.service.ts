import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Menu } from '../menus/entities/menu.entity';
import { Review } from '../reviews/entities/review.entity';
import { Reservation } from '../reservations/entities/reservation.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Menu)
    private menusRepository: Repository<Menu>,
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
  ) {}

  // Analytics for restaurant owners
  async getRestaurantAnalytics(restaurantId: string, startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const end = endDate || new Date();

    // Orders by day
    const ordersByDay = await this.ordersRepository
      .createQueryBuilder('order')
      .select("DATE(order.createdAt)", "date")
      .addSelect("COUNT(*)", "count")
      .where('order.restaurantId = :restaurantId', { restaurantId })
      .andWhere('order.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy("DATE(order.createdAt)")
      .orderBy("DATE(order.createdAt)", "ASC")
      .getRawMany();

    // Most popular menus
    const popularMenus = await this.menusRepository
      .createQueryBuilder('menu')
      .leftJoin('menu.orderItems', 'orderItem')
      .leftJoin('orderItem.order', 'order')
      .select('menu.id', 'id')
      .addSelect('menu.name', 'name')
      .addSelect('SUM(orderItem.quantity)', 'totalSold')
      .where('menu.restaurantId = :restaurantId', { restaurantId })
      .andWhere('order.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('menu.id')
      .orderBy('totalSold', 'DESC')
      .limit(10)
      .getRawMany();

    // Least popular menus
    const leastPopularMenus = await this.menusRepository
      .createQueryBuilder('menu')
      .leftJoin('menu.orderItems', 'orderItem')
      .leftJoin('orderItem.order', 'order')
      .select('menu.id', 'id')
      .addSelect('menu.name', 'name')
      .addSelect('COALESCE(SUM(orderItem.quantity), 0)', 'totalSold')
      .where('menu.restaurantId = :restaurantId', { restaurantId })
      .andWhere('(order.createdAt BETWEEN :start AND :end OR order.createdAt IS NULL)', { start, end })
      .groupBy('menu.id')
      .orderBy('totalSold', 'ASC')
      .limit(10)
      .getRawMany();

    // Reviews analysis
    const reviews = await this.reviewsRepository.find({
      where: {
        restaurantId,
        createdAt: Between(start, end),
      },
    });

    const reviewSentiment = reviews.map(review => ({
      id: review.id,
      comment: review.comment,
      rating: review.rating,
      // This would be enhanced with ML sentiment analysis
    }));

    // Reservations by day
    const reservationsByDay = await this.reservationsRepository
      .createQueryBuilder('reservation')
      .select("DATE(reservation.date)", "date")
      .addSelect("COUNT(*)", "count")
      .where('reservation.restaurantId = :restaurantId', { restaurantId })
      .andWhere('reservation.date BETWEEN :start AND :end', { start, end })
      .groupBy("DATE(reservation.date)")
      .orderBy("DATE(reservation.date)", "ASC")
      .getRawMany();

    return {
      ordersByDay,
      popularMenus,
      leastPopularMenus,
      reviewSentiment,
      reservationsByDay,
      totalOrders: ordersByDay.reduce((sum, day) => sum + parseInt(day.count), 0),
      totalReservations: reservationsByDay.reduce((sum, day) => sum + parseInt(day.count), 0),
    };
  }

  // Get suggestions based on reviews
  async getSuggestions(restaurantId: string) {
    const reviews = await this.reviewsRepository.find({
      where: { restaurantId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    // Simple keyword extraction (would be enhanced with ML)
    const suggestions = [];
    const commonIssues = ['lento', 'espera', 'servicio', 'comida', 'precio', 'calidad'];

    reviews.forEach(review => {
      if (review.rating <= 2) {
        const lowerComment = review.comment.toLowerCase();
        commonIssues.forEach(issue => {
          if (lowerComment.includes(issue)) {
            suggestions.push({
              type: issue,
              comment: review.comment,
              rating: review.rating,
            });
          }
        });
      }
    });

    return {
      suggestions: suggestions.slice(0, 10),
      totalReviews: reviews.length,
      averageRating: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
    };
  }
}

