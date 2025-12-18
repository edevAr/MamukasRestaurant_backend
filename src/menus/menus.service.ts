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
      // Normalizar la fecha para comparación
      // Extraer solo año, mes y día para evitar problemas de zona horaria
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth() + 1;
      const day = date.getUTCDate();
      
      // Crear fecha normalizada (inicio y fin del día en UTC)
      const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
      
      console.log(`🔍 Comparing menu date:`, {
        original: date.toISOString(),
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString(),
        year,
        month,
        day
      });
      
      // Usar BETWEEN para comparar el rango del día completo
      // Esto funciona mejor con TypeORM y PostgreSQL
      query.andWhere('menu.date >= :startOfDay AND menu.date <= :endOfDay', {
        startOfDay: startOfDay,
        endOfDay: endOfDay,
      });
    }

    if (type) {
      query.andWhere('menu.type = :type', { type });
    }

    // Solo mostrar menús disponibles
    query.andWhere('menu.available = :available', { available: true });

    // Log la query SQL generada para debug
    const sql = query.getSql();
    const params = query.getParameters();
    console.log(`📋 SQL Query:`, sql);
    console.log(`📋 Query Parameters:`, params);

    const results = await query
      .orderBy('menu.isPromoted', 'DESC')
      .addOrderBy('menu.type', 'ASC')
      .addOrderBy('menu.createdAt', 'DESC')
      .getMany();

    console.log(`📋 MenusService.findAll: Found ${results.length} menus for restaurantId=${restaurantId}, date=${date?.toISOString()}`);
    
    // Si no hay resultados, verificar si hay menús sin filtro de fecha
    if (results.length === 0 && restaurantId) {
      const allMenus = await this.menusRepository.find({
        where: { restaurantId },
        take: 5,
      });
      console.log(`⚠️ No menus found for date, but found ${allMenus.length} total menus for this restaurant`);
      if (allMenus.length > 0) {
        console.log(`📅 Sample menu dates:`, allMenus.map(m => ({ id: m.id, date: m.date, name: m.name })));
      }
    }
    
    return results;
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

