import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './entities/menu.entity';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { Role } from '../common/enums/role.enum';
import { RestaurantsService } from '../restaurants/restaurants.service';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Menu)
    private menusRepository: Repository<Menu>,
    private restaurantsService: RestaurantsService,
  ) {}

  async create(createMenuDto: CreateMenuDto, ownerId: string): Promise<Menu> {
    const restaurant = await this.restaurantsService.findOne(createMenuDto.restaurantId);
    
    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to add menus to this restaurant');
    }

    const menu = this.menusRepository.create(createMenuDto);
    return this.menusRepository.save(menu);
  }

  async findAll(restaurantId?: string, date?: Date, type?: string): Promise<Menu[]> {
    const query = this.menusRepository.createQueryBuilder('menu');

    if (restaurantId) {
      query.where('menu.restaurantId = :restaurantId', { restaurantId });
    }

    if (date) {
      query.andWhere('menu.date = :date', { date });
    }

    if (type) {
      query.andWhere('menu.type = :type', { type });
    }

    return query
      .orderBy('menu.isPromoted', 'DESC')
      .addOrderBy('menu.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Menu> {
    const menu = await this.menusRepository.findOne({
      where: { id },
      relations: ['restaurant'],
    });

    if (!menu) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }

    return menu;
  }

  async update(
    id: string,
    updateMenuDto: UpdateMenuDto,
    userId: string,
    userRole: Role,
  ): Promise<Menu> {
    const menu = await this.findOne(id);
    const restaurant = await this.restaurantsService.findOne(menu.restaurantId);

    if (userRole !== Role.ADMIN && restaurant.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to update this menu');
    }

    Object.assign(menu, updateMenuDto);
    return this.menusRepository.save(menu);
  }

  async remove(id: string, userId: string, userRole: Role): Promise<void> {
    const menu = await this.findOne(id);
    const restaurant = await this.restaurantsService.findOne(menu.restaurantId);

    if (userRole !== Role.ADMIN && restaurant.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this menu');
    }

    await this.menusRepository.remove(menu);
  }

  async updateAvailability(id: string, available: boolean, quantity?: number): Promise<Menu> {
    const menu = await this.findOne(id);
    menu.available = available;
    if (quantity !== undefined) {
      menu.quantity = quantity;
    }
    return this.menusRepository.save(menu);
  }

  async promote(id: string): Promise<Menu> {
    const menu = await this.findOne(id);
    menu.isPromoted = true;
    return this.menusRepository.save(menu);
  }

  async unpromote(id: string): Promise<Menu> {
    const menu = await this.findOne(id);
    menu.isPromoted = false;
    return this.menusRepository.save(menu);
  }
}

