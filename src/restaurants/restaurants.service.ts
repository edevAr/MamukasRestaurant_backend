import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { Role } from '../common/enums/role.enum';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantsRepository: Repository<Restaurant>,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(createRestaurantDto: CreateRestaurantDto, ownerId: string): Promise<Restaurant> {
    const restaurant = this.restaurantsRepository.create({
      ...createRestaurantDto,
      ownerId,
    });
    return this.restaurantsRepository.save(restaurant);
  }

  async findAll(
    latitude?: number,
    longitude?: number,
    radius?: number,
    includeInactive: boolean = false,
  ): Promise<Restaurant[]> {
    const query = this.restaurantsRepository
      .createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.owner', 'owner')
      .select([
        'restaurant.id',
        'restaurant.name',
        'restaurant.description',
        'restaurant.cuisine',
        'restaurant.address',
        'restaurant.latitude',
        'restaurant.longitude',
        'restaurant.phone',
        'restaurant.email',
        'restaurant.image',
        'restaurant.logo',
        'restaurant.openingHours',
        'restaurant.isOpen',
        'restaurant.isActive',
        'restaurant.rating',
        'restaurant.totalReviews',
        'restaurant.isPromoted',
        'owner.id',
        'owner.firstName',
        'owner.lastName',
      ]);
    
    // Only filter by isActive if not including inactive (for public/client view)
    if (!includeInactive) {
      query.where('restaurant.isActive = :isActive', { isActive: true });
    }

    if (latitude && longitude && radius) {
      // Calculate distance using Haversine formula
      query
        .addSelect(
          `(
          6371 * acos(
            cos(radians(:lat)) * 
            cos(radians(restaurant.latitude)) * 
            cos(radians(restaurant.longitude) - radians(:lng)) + 
            sin(radians(:lat)) * 
            sin(radians(restaurant.latitude))
          )
        )`,
          'distance',
        )
        .setParameter('lat', latitude)
        .setParameter('lng', longitude)
        .having('distance <= :radius', { radius })
        .orderBy('distance', 'ASC');
    } else {
      query.orderBy('restaurant.isPromoted', 'DESC').addOrderBy('restaurant.rating', 'DESC');
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantsRepository.findOne({
      where: { id },
      relations: ['owner', 'menus', 'reviews'],
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    return restaurant;
  }

  async update(
    id: string,
    updateRestaurantDto: UpdateRestaurantDto,
    userId: string,
    userRole: Role,
  ): Promise<Restaurant> {
    const restaurant = await this.findOne(id);

    if (userRole !== Role.ADMIN && restaurant.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to update this restaurant');
    }

    Object.assign(restaurant, updateRestaurantDto);
    return this.restaurantsRepository.save(restaurant);
  }

  async remove(id: string, userId: string, userRole: Role): Promise<void> {
    const restaurant = await this.findOne(id);

    if (userRole !== Role.ADMIN && restaurant.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this restaurant');
    }

    await this.restaurantsRepository.remove(restaurant);
  }

  async activate(id: string): Promise<Restaurant> {
    const restaurant = await this.findOne(id);
    restaurant.isActive = true;
    return this.restaurantsRepository.save(restaurant);
  }

  async deactivate(id: string): Promise<Restaurant> {
    const restaurant = await this.findOne(id);
    restaurant.isActive = false;
    return this.restaurantsRepository.save(restaurant);
  }

  async promote(id: string): Promise<Restaurant> {
    const restaurant = await this.findOne(id);
    restaurant.isPromoted = true;
    return this.restaurantsRepository.save(restaurant);
  }

  async unpromote(id: string): Promise<Restaurant> {
    const restaurant = await this.findOne(id);
    restaurant.isPromoted = false;
    restaurant.promotionText = null;
    restaurant.promotionImage = null;
    restaurant.promotionStartDate = null;
    restaurant.promotionEndDate = null;
    return this.restaurantsRepository.save(restaurant);
  }

  async updatePromotion(
    id: string,
    promotionData: {
      promotionText?: string;
      promotionImage?: string;
      promotionStartDate?: Date | null;
      promotionEndDate?: Date | null;
    },
  ): Promise<Restaurant> {
    const restaurant = await this.findOne(id);
    restaurant.isPromoted = true;
    if (promotionData.promotionText !== undefined) {
      restaurant.promotionText = promotionData.promotionText;
    }
    if (promotionData.promotionImage !== undefined) {
      restaurant.promotionImage = promotionData.promotionImage;
    }
    if (promotionData.promotionStartDate !== undefined) {
      restaurant.promotionStartDate = promotionData.promotionStartDate;
    }
    if (promotionData.promotionEndDate !== undefined) {
      restaurant.promotionEndDate = promotionData.promotionEndDate;
    }
    return this.restaurantsRepository.save(restaurant);
  }

  async updateOpeningHours(
    id: string,
    openingHours: any,
    userId: string,
  ): Promise<Restaurant> {
    const restaurant = await this.findOne(id);

    if (restaurant.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to update this restaurant');
    }

    restaurant.openingHours = openingHours;
    return this.restaurantsRepository.save(restaurant);
  }

  async toggleOpenStatus(id: string, userId: string): Promise<Restaurant> {
    console.log(`🔄 toggleOpenStatus called - Restaurant ID: ${id}, User ID: ${userId}`);
    
    const restaurant = await this.findOne(id);
    console.log(`📋 Restaurant found: ${restaurant.name}, Current isOpen: ${restaurant.isOpen}`);

    if (restaurant.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to update this restaurant');
    }

    restaurant.isOpen = !restaurant.isOpen;
    console.log(`🔄 Toggling restaurant status to: ${restaurant.isOpen}`);
    
    const savedRestaurant = await this.restaurantsRepository.save(restaurant);
    console.log(`💾 Restaurant saved with isOpen: ${savedRestaurant.isOpen}`);

    // Emit socket event to notify all clients
    const message = savedRestaurant.isOpen 
      ? `${restaurant.name} está ahora abierto` 
      : `${restaurant.name} está ahora cerrado`;
    
    this.notificationsGateway.notifyRestaurantStatus(
      savedRestaurant.id,
      savedRestaurant.isOpen,
      message
    );

    return savedRestaurant;
  }
}

