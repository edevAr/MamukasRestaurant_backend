import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Sale, SaleStatus } from './entities/sale.entity';
import { SaleItem, SaleItemStatus } from './entities/sale-item.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleStatusDto, UpdateSaleItemStatusDto } from './dto/update-sale.dto';
import { MenusService } from '../menus/menus.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemsRepository: Repository<SaleItem>,
    private menusService: MenusService,
    private restaurantsService: RestaurantsService,
    private eventsService: EventsService,
  ) {}

  async create(createSaleDto: CreateSaleDto, cashierId: string, restaurantId: string): Promise<Sale> {
    // Verificar que el restaurante existe
    const restaurant = await this.restaurantsService.findOne(restaurantId);
    
    // Obtener los menús del día actual
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const menus = await this.menusService.findAll(restaurantId, today);

    let total = 0;
    const saleItems: SaleItem[] = [];

    // Validar y crear items
    for (const itemDto of createSaleDto.items) {
      const menu = menus.find(m => m.id === itemDto.menuId);
      
      if (!menu) {
        throw new NotFoundException(`Menu item with ID ${itemDto.menuId} not found for today`);
      }

      if (!menu.available) {
        throw new BadRequestException(`Menu item "${menu.name}" is not available`);
      }

      if (menu.quantity < itemDto.quantity) {
        throw new BadRequestException(`Insufficient quantity for "${menu.name}". Available: ${menu.quantity}, Requested: ${itemDto.quantity}`);
      }

      const subtotal = menu.price * itemDto.quantity;
      total += subtotal;

      const saleItem = this.saleItemsRepository.create({
        menuId: itemDto.menuId,
        menuName: menu.name,
        price: menu.price,
        quantity: itemDto.quantity,
        subtotal,
        notes: itemDto.notes,
        status: SaleItemStatus.PENDING,
      });

      saleItems.push(saleItem);
    }

    // Crear la venta
    const sale = this.salesRepository.create({
      total,
      notes: createSaleDto.notes,
      tableNumber: createSaleDto.tableNumber,
      customerName: createSaleDto.customerName,
      cashierId,
      restaurantId,
      status: SaleStatus.PENDING,
      items: saleItems,
    });

    const savedSale = await this.salesRepository.save(sale);

    // Cargar relaciones
    const saleWithRelations = await this.salesRepository.findOne({
      where: { id: savedSale.id },
      relations: ['cashier', 'restaurant', 'items'],
    });

    // Emitir evento de nueva venta para cocineros
    this.eventsService.emitNewSale(restaurantId, saleWithRelations);

    return saleWithRelations;
  }

  async findAll(restaurantId: string, userId: string, userRole: string, staffRole?: string): Promise<Sale[]> {
    const query = this.salesRepository.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.cashier', 'cashier')
      .leftJoinAndSelect('sale.restaurant', 'restaurant')
      .leftJoinAndSelect('sale.items', 'items')
      .where('sale.restaurantId = :restaurantId', { restaurantId })
      .orderBy('sale.createdAt', 'DESC');

    // Vendedores solo ven sus propias ventas
    if (staffRole === 'cashier') {
      query.andWhere('sale.cashierId = :userId', { userId });
    }

    return query.getMany();
  }

  async findOne(id: string, restaurantId: string, userRole: string, staffRole?: string, userId?: string): Promise<Sale> {
    const query = this.salesRepository.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.cashier', 'cashier')
      .leftJoinAndSelect('sale.restaurant', 'restaurant')
      .leftJoinAndSelect('sale.items', 'items')
      .where('sale.id = :id', { id })
      .andWhere('sale.restaurantId = :restaurantId', { restaurantId });

    // Vendedores solo pueden ver sus propias ventas
    if (staffRole === 'cashier' && userId) {
      query.andWhere('sale.cashierId = :userId', { userId });
    }

    const sale = await query.getOne();

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    return sale;
  }

  async updateStatus(id: string, updateDto: UpdateSaleStatusDto, restaurantId: string, userRole: string, staffRole?: string): Promise<Sale> {
    const sale = await this.findOne(id, restaurantId, userRole, staffRole);

    // Validar transiciones de estado según el rol
    if (staffRole === 'cashier') {
      // Vendedores solo pueden confirmar ventas pendientes
      if (updateDto.status !== SaleStatus.CONFIRMED && sale.status === SaleStatus.PENDING) {
        throw new ForbiddenException('Cashiers can only confirm pending sales');
      }
    } else if (staffRole === 'cook') {
      // Cocineros pueden cambiar a preparing o ready
      if (![SaleStatus.PREPARING, SaleStatus.READY].includes(updateDto.status)) {
        throw new ForbiddenException('Cooks can only set status to preparing or ready');
      }
    } else if (staffRole === 'waiter') {
      // Meseros pueden marcar como delivered
      if (updateDto.status !== SaleStatus.DELIVERED) {
        throw new ForbiddenException('Waiters can only mark sales as delivered');
      }
    }

    sale.status = updateDto.status;
    const updatedSale = await this.salesRepository.save(sale);

    // Emitir evento de actualización
    this.eventsService.emitSaleUpdate(restaurantId, updatedSale);

    return updatedSale;
  }

  async updateItemStatus(saleId: string, updateDto: UpdateSaleItemStatusDto, restaurantId: string, userRole: string, staffRole?: string): Promise<SaleItem> {
    const sale = await this.findOne(saleId, restaurantId, userRole, staffRole);

    const item = sale.items.find(i => i.id === updateDto.saleItemId);
    if (!item) {
      throw new NotFoundException(`Sale item with ID ${updateDto.saleItemId} not found`);
    }

    if (updateDto.status) {
      // Validar transiciones según rol
      if (staffRole === 'cook') {
        if (!['preparing', 'ready'].includes(updateDto.status)) {
          throw new ForbiddenException('Cooks can only set item status to preparing or ready');
        }
      } else if (staffRole === 'waiter') {
        if (updateDto.status !== 'delivered') {
          throw new ForbiddenException('Waiters can only mark items as delivered');
        }
      }

      item.status = updateDto.status as SaleItemStatus;
      await this.saleItemsRepository.save(item);

      // Verificar si todos los items están listos
      const allReady = sale.items.every(i => i.status === SaleItemStatus.READY || i.status === SaleItemStatus.DELIVERED);
      if (allReady && sale.status === SaleStatus.PREPARING) {
        sale.status = SaleStatus.READY;
        await this.salesRepository.save(sale);
      }

      // Emitir evento
      this.eventsService.emitSaleUpdate(restaurantId, await this.findOne(saleId, restaurantId, userRole, staffRole));
    }

    return item;
  }

  async getPendingForKitchen(restaurantId: string): Promise<Sale[]> {
    return this.salesRepository.find({
      where: {
        restaurantId,
        status: In([SaleStatus.CONFIRMED, SaleStatus.PREPARING]),
      },
      relations: ['cashier', 'items'],
      order: { createdAt: 'ASC' },
    });
  }

  async getReadyForDelivery(restaurantId: string): Promise<Sale[]> {
    return this.salesRepository.find({
      where: {
        restaurantId,
        status: SaleStatus.READY,
      },
      relations: ['cashier', 'items'],
      order: { createdAt: 'ASC' },
    });
  }
}
