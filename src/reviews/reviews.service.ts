import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    private restaurantsService: RestaurantsService,
  ) {}

  async create(createReviewDto: CreateReviewDto, clientId: string): Promise<Review> {
    // Check if user already reviewed this restaurant
    const existingReview = await this.reviewsRepository.findOne({
      where: { clientId, restaurantId: createReviewDto.restaurantId },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this restaurant');
    }

    const review = this.reviewsRepository.create({
      ...createReviewDto,
      clientId,
    });

    const savedReview = await this.reviewsRepository.save(review);
    await this.updateRestaurantRating(createReviewDto.restaurantId);

    return this.reviewsRepository.findOne({
      where: { id: savedReview.id },
      relations: ['client', 'restaurant'],
    });
  }

  async findAll(restaurantId?: string): Promise<Review[]> {
    const query = this.reviewsRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.client', 'client')
      .leftJoinAndSelect('review.restaurant', 'restaurant');

    if (restaurantId) {
      query.where('review.restaurantId = :restaurantId', { restaurantId });
    }

    return query.orderBy('review.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: ['client', 'restaurant'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto, userId: string): Promise<Review> {
    const review = await this.findOne(id);

    if (review.clientId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    Object.assign(review, updateReviewDto);
    const savedReview = await this.reviewsRepository.save(review);
    await this.updateRestaurantRating(review.restaurantId);

    return savedReview;
  }

  async remove(id: string, userId: string, userRole: Role): Promise<void> {
    const review = await this.findOne(id);

    if (userRole !== Role.ADMIN && review.clientId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this review');
    }

    const restaurantId = review.restaurantId;
    await this.reviewsRepository.remove(review);
    await this.updateRestaurantRating(restaurantId);
  }

  private async updateRestaurantRating(restaurantId: string): Promise<void> {
    const reviews = await this.reviewsRepository.find({
      where: { restaurantId },
    });

    if (reviews.length === 0) {
      const restaurant = await this.restaurantsService.findOne(restaurantId);
      restaurant.rating = 0;
      restaurant.totalReviews = 0;
      await this.restaurantsService.update(restaurantId, restaurant, '', null as any);
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    const restaurant = await this.restaurantsService.findOne(restaurantId);
    restaurant.rating = Math.round(averageRating * 100) / 100; // Round to 2 decimals
    restaurant.totalReviews = reviews.length;
    await this.restaurantsService.update(restaurantId, restaurant, '', null as any);
  }

  async adjustRating(restaurantId: string, adjustment: number): Promise<void> {
    const restaurant = await this.restaurantsService.findOne(restaurantId);
    restaurant.rating = Math.max(0, Math.min(5, restaurant.rating + adjustment));
    await this.restaurantsService.update(restaurantId, restaurant, '', null as any);
  }
}

