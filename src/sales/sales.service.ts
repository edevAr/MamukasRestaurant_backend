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
import { Role } from '../common/enums/role.enum';

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
    
    // Obtener los menús del día actual primero
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMenus = await this.menusService.findAll(restaurantId, today);

    let total = 0;
    const saleItems: SaleItem[] = [];

    // Validar y crear items
    for (const itemDto of createSaleDto.items) {
      // Buscar primero en los menús del día actual
      let menu = todayMenus.find(m => m.id === itemDto.menuId);
      
      // Si no se encuentra en los menús de hoy, buscar por ID sin restricción de fecha
      if (!menu) {
        try {
          menu = await this.menusService.findOne(itemDto.menuId);
          
          // Verificar que el menú pertenece al restaurante correcto
          if (menu.restaurantId !== restaurantId) {
            throw new NotFoundException(`Menu item with ID ${itemDto.menuId} does not belong to this restaurant`);
          }
          
          // Verificar que el menú está disponible
          if (!menu.available) {
            throw new BadRequestException(`Menu item "${menu.name}" is not available`);
          }
          
          // Verificar que hay suficiente cantidad
          if (menu.quantity < itemDto.quantity) {
            throw new BadRequestException(`Insufficient quantity for "${menu.name}". Available: ${menu.quantity}, Requested: ${itemDto.quantity}`);
          }
        } catch (error) {
          if (error instanceof NotFoundException || error instanceof BadRequestException) {
            throw error;
          }
          throw new NotFoundException(`Menu item with ID ${itemDto.menuId} not found`);
        }
      }
      
      if (!menu) {
        throw new NotFoundException(`Menu item with ID ${itemDto.menuId} not found`);
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

    const sales = await query.getMany();
    
    // Actualizar estados de ventas basado en el estado de sus items
    for (const sale of sales) {
      if (sale.items && sale.items.length > 0) {
        const hasPreparingItems = sale.items.some(i => i.status === SaleItemStatus.PREPARING);
        const hasReadyItems = sale.items.some(i => i.status === SaleItemStatus.READY);
        const allReady = sale.items.every(i => i.status === SaleItemStatus.READY || i.status === SaleItemStatus.DELIVERED);
        const allDelivered = sale.items.every(i => i.status === SaleItemStatus.DELIVERED);
        
        let shouldUpdate = false;
        let newStatus: SaleStatus | null = null;
        
        if (allDelivered && sale.status !== SaleStatus.DELIVERED) {
          newStatus = SaleStatus.DELIVERED;
          shouldUpdate = true;
        } else if (allReady && sale.status !== SaleStatus.READY) {
          newStatus = SaleStatus.READY;
          shouldUpdate = true;
        } else if (hasPreparingItems && (sale.status === SaleStatus.PENDING || sale.status === SaleStatus.CONFIRMED)) {
          newStatus = SaleStatus.PREPARING;
          shouldUpdate = true;
        } else if (hasReadyItems && sale.status === SaleStatus.PREPARING) {
          // Si hay items listos pero no todos, mantener en preparing
          // pero si todos están listos, ya se actualizó arriba
        }
        
        if (shouldUpdate && newStatus) {
          sale.status = newStatus;
          await this.salesRepository.save(sale);
        }
      }
    }
    
    // Recargar las ventas actualizadas
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
    console.log('🔧 updateItemStatus called:', { saleId, updateDto, restaurantId, userRole, staffRole })
    
    if (!updateDto.saleItemId) {
      throw new BadRequestException('saleItemId is required');
    }
    
    if (!updateDto.status) {
      throw new BadRequestException('status is required');
    }
    
    const sale = await this.findOne(saleId, restaurantId, userRole, staffRole);

    const item = sale.items.find(i => i.id === updateDto.saleItemId);
    if (!item) {
      throw new NotFoundException(`Sale item with ID ${updateDto.saleItemId} not found`);
    }

    console.log('📦 Current item status:', item.status, 'Requested status:', updateDto.status)

    if (updateDto.status) {
      // Validar transiciones según rol
      // Owners y cocineros pueden gestionar el estado de los items
      // userRole puede venir como enum Role.OWNER ('owner') o como string 'owner'
      const isOwner = userRole === 'owner' || userRole === Role.OWNER
      const canManageKitchen = staffRole === 'cook' || isOwner || staffRole === 'administrator' || staffRole === 'manager'
      console.log('👤 Permission check:', { isOwner, canManageKitchen, userRole, staffRole })
      
      if (canManageKitchen) {
        // Cocineros y owners pueden: iniciar preparación (pending -> preparing), marcar como listo (preparing -> ready), o despachar (preparing/ready -> delivered)
        if (!['preparing', 'ready', 'delivered'].includes(updateDto.status)) {
          throw new ForbiddenException('Can only set item status to preparing, ready, or delivered');
        }
        // Validar transición válida desde el estado actual
        if (item.status === SaleItemStatus.PENDING && updateDto.status !== 'preparing') {
          throw new ForbiddenException('Can only start preparing from pending status');
        }
        if (item.status === SaleItemStatus.PREPARING && !['ready', 'delivered'].includes(updateDto.status)) {
          throw new ForbiddenException('Can only mark as ready or dispatch from preparing status');
        }
        if (item.status === SaleItemStatus.READY && updateDto.status !== 'delivered') {
          throw new ForbiddenException('Can only dispatch from ready status');
        }
      } else if (staffRole === 'waiter') {
        if (updateDto.status !== 'delivered') {
          throw new ForbiddenException('Waiters can only mark items as delivered');
        }
      } else {
        throw new ForbiddenException('You do not have permission to update item status');
      }

      item.status = updateDto.status as SaleItemStatus;
      await this.saleItemsRepository.save(item);

      // Actualizar estado de la venta basado en los estados de los items
      const hasPreparingItems = sale.items.some(i => i.status === SaleItemStatus.PREPARING);
      const hasReadyItems = sale.items.some(i => i.status === SaleItemStatus.READY);
      const allReady = sale.items.every(i => i.status === SaleItemStatus.READY || i.status === SaleItemStatus.DELIVERED);
      const allDelivered = sale.items.every(i => i.status === SaleItemStatus.DELIVERED);

      // Actualizar estado de la venta según el progreso de los items
      if (allDelivered && sale.status !== SaleStatus.DELIVERED) {
        sale.status = SaleStatus.DELIVERED;
        await this.salesRepository.save(sale);
      } else if (allReady && sale.status !== SaleStatus.READY) {
        sale.status = SaleStatus.READY;
        await this.salesRepository.save(sale);
      } else if (hasPreparingItems && (sale.status === SaleStatus.PENDING || sale.status === SaleStatus.CONFIRMED)) {
        // Si algún item está en preparación y la venta está pendiente o confirmada, cambiar a preparando
        sale.status = SaleStatus.PREPARING;
        await this.salesRepository.save(sale);
      } else if (updateDto.status === SaleItemStatus.PREPARING && sale.status === SaleStatus.PENDING) {
        // Si se empieza a preparar un item y la venta está pendiente, confirmarla primero
        sale.status = SaleStatus.CONFIRMED;
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
        status: In([SaleStatus.PENDING, SaleStatus.CONFIRMED, SaleStatus.PREPARING]),
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
