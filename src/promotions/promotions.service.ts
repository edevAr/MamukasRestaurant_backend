import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion } from './entities/promotion.entity';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private promotionsRepository: Repository<Promotion>,
    private restaurantsService: RestaurantsService,
  ) {}

  async create(createPromotionDto: CreatePromotionDto, ownerId: string): Promise<Promotion> {
    const restaurant = await this.restaurantsService.findOne(createPromotionDto.restaurantId);
    
    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to create promotions for this restaurant');
    }

    const promotion = this.promotionsRepository.create(createPromotionDto);
    return this.promotionsRepository.save(promotion);
  }

  async findAll(restaurantId?: string, active?: boolean): Promise<Promotion[]> {
    const query = this.promotionsRepository.createQueryBuilder('promotion')
      .leftJoinAndSelect('promotion.restaurant', 'restaurant');

    if (restaurantId) {
      query.where('promotion.restaurantId = :restaurantId', { restaurantId });
    }

    if (active !== undefined) {
      query.andWhere('promotion.isActive = :active', { active });
    }

    const now = new Date();
    if (active) {
      query
        .andWhere('promotion.startDate <= :now', { now })
        .andWhere('promotion.endDate >= :now', { now });
    }

    return query
      .orderBy('promotion.isPromoted', 'DESC')
      .addOrderBy('promotion.startDate', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Promotion> {
    const promotion = await this.promotionsRepository.findOne({
      where: { id },
      relations: ['restaurant'],
    });

    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${id} not found`);
    }

    return promotion;
  }

  async update(
    id: string,
    updatePromotionDto: UpdatePromotionDto,
    userId: string,
    userRole: Role,
  ): Promise<Promotion> {
    const promotion = await this.findOne(id);
    const restaurant = await this.restaurantsService.findOne(promotion.restaurantId);

    if (userRole !== Role.ADMIN && restaurant.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to update this promotion');
    }

    Object.assign(promotion, updatePromotionDto);
    return this.promotionsRepository.save(promotion);
  }

  async remove(id: string, userId: string, userRole: Role): Promise<void> {
    const promotion = await this.findOne(id);
    const restaurant = await this.restaurantsService.findOne(promotion.restaurantId);

    if (userRole !== Role.ADMIN && restaurant.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this promotion');
    }

    await this.promotionsRepository.remove(promotion);
  }

  async promote(id: string): Promise<Promotion> {
    const promotion = await this.findOne(id);
    promotion.isPromoted = true;
    return this.promotionsRepository.save(promotion);
  }

  async unpromote(id: string): Promise<Promotion> {
    const promotion = await this.findOne(id);
    promotion.isPromoted = false;
    return this.promotionsRepository.save(promotion);
  }
}

