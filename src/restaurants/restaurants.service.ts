import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { Role } from '../common/enums/role.enum';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { EventsService } from '../events/events.service';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantsRepository: Repository<Restaurant>,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
    private eventsService: EventsService,
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
        'restaurant.promotionText',
        'restaurant.promotionImage',
        'restaurant.promotionStartDate',
        'restaurant.promotionEndDate',
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

    const results = await query.getMany();
    
    // Eliminar duplicados por ID (por si acaso hay algún problema con el query)
    const uniqueResults = Array.from(
      new Map(results.map((rest) => [rest.id, rest])).values()
    );
    
    // Calcular isOpen basado en horarios para cada restaurante
    const restaurantsWithCalculatedStatus = uniqueResults.map(restaurant => {
      const calculatedIsOpen = this.calculateIsOpenFromHours(restaurant.openingHours);
      
      // Solo actualizar si el estado calculado es diferente al almacenado
      if (restaurant.isOpen !== calculatedIsOpen) {
        restaurant.isOpen = calculatedIsOpen;
        // Guardar el cambio en la base de datos (sin await para no bloquear)
        this.restaurantsRepository.update(restaurant.id, { isOpen: calculatedIsOpen }).catch(err => {
          console.error(`Error updating isOpen for restaurant ${restaurant.id}:`, err);
        });
        
        // Emitir evento de cambio de estado
        const message = calculatedIsOpen 
          ? `${restaurant.name} está ahora abierto` 
          : `${restaurant.name} está ahora cerrado`;
        this.eventsService.emitRestaurantStatus(restaurant.id, calculatedIsOpen, message);
      }
      
      return restaurant;
    });
    
    return restaurantsWithCalculatedStatus;
  }

  async findOne(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantsRepository.findOne({
      where: { id },
      relations: ['owner', 'menus', 'reviews'],
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    // NO recalcular isOpen automáticamente en findOne
    // El cron job se encargará de actualizar el estado en el momento correcto
    // Esto evita cambios inmediatos cuando se consulta el restaurante
    // Solo el cron job debe actualizar isOpen basado en horarios

    return restaurant;
  }

  /**
   * Calcula si un restaurante está abierto basado en sus horarios y la hora actual
   */
  private calculateIsOpenFromHours(openingHours: any): boolean {
    if (!openingHours || typeof openingHours !== 'object') {
      return false;
    }

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    
    // Mapear día de la semana a clave de openingHours
    const dayMap: Record<number, string> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };

    const todayKey = dayMap[currentDay];
    const todayHours = openingHours[todayKey];

    // Si el día no está configurado o está cerrado, retornar false
    if (!todayHours || !todayHours.open) {
      return false;
    }

    // Si no tiene horarios de apertura/cierre, asumir que está abierto si open = true
    if (!todayHours.openTime || !todayHours.closeTime) {
      return todayHours.open;
    }

    // Convertir hora actual a minutos desde medianoche
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Convertir horarios de apertura y cierre a minutos
    const [openHour, openMin] = todayHours.openTime.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.closeTime.split(':').map(Number);
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    // Verificar si la hora actual está dentro del rango
    if (openMinutes <= closeMinutes) {
      // Horario normal (ej: 09:00 - 22:00)
      return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    } else {
      // Horario que cruza medianoche (ej: 22:00 - 02:00)
      return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
    }
  }

  async findByOwnerId(ownerId: string): Promise<Restaurant | null> {
    return this.restaurantsRepository.findOne({
      where: { ownerId },
    });
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
    
    // NO recalcular isOpen inmediatamente al actualizar horarios
    // El cron job se encargará de actualizar el estado en el momento correcto
    // Esto evita que el restaurante se cierre/abra inmediatamente al cambiar los horarios
    const savedRestaurant = await this.restaurantsRepository.save(restaurant);

    // Emit SSE event to notify all clients about hours update
    console.log(`📡 Emitting restaurant hours update via SSE: ${savedRestaurant.id}`);
    this.eventsService.emitRestaurantHoursUpdated(
      savedRestaurant.id,
      openingHours
    );

    return savedRestaurant;
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

    // Emit SSE event to notify all clients
    const message = savedRestaurant.isOpen 
      ? `${restaurant.name} está ahora abierto` 
      : `${restaurant.name} está ahora cerrado`;
    
    console.log(`📡 Emitting restaurant status via SSE: ${savedRestaurant.id}, isOpen: ${savedRestaurant.isOpen}`);
    
    // Emit via SSE
    this.eventsService.emitRestaurantStatus(
      savedRestaurant.id,
      savedRestaurant.isOpen,
      message
    );

    // Also emit via socket for backward compatibility (can be removed later)
    this.notificationsGateway.notifyRestaurantStatus(
      savedRestaurant.id,
      savedRestaurant.isOpen,
      message
    );

    return savedRestaurant;
  }
}

