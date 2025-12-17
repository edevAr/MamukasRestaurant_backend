import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { MenusService } from '../menus/menus.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    private menusService: MenusService,
  ) {}

  async create(createOrderDto: CreateOrderDto, clientId: string): Promise<Order> {
    let total = 0;
    const orderItems: OrderItem[] = [];

    // Validate and calculate total
    for (const item of createOrderDto.items) {
      const menu = await this.menusService.findOne(item.menuId);

      if (!menu.available || menu.quantity < item.quantity) {
        throw new BadRequestException(
          `Menu item ${menu.name} is not available or quantity insufficient`,
        );
      }

      const itemTotal = menu.price * item.quantity;
      total += itemTotal;

      const orderItem = this.orderItemsRepository.create({
        menuId: item.menuId,
        quantity: item.quantity,
        price: menu.price,
      });

      orderItems.push(orderItem);
    }

    const order = this.ordersRepository.create({
      ...createOrderDto,
      clientId,
      total,
      items: orderItems,
    });

    const savedOrder = await this.ordersRepository.save(order);

    // Update menu quantities
    for (const item of createOrderDto.items) {
      const menu = await this.menusService.findOne(item.menuId);
      await this.menusService.update(
        menu.id,
        {
          quantity: menu.quantity - item.quantity,
          totalSold: menu.totalSold + item.quantity,
        },
        '',
        null as any,
      );
    }

    return this.ordersRepository.findOne({
      where: { id: savedOrder.id },
      relations: ['items', 'items.menu', 'restaurant', 'client'],
    });
  }

  async findAll(userId?: string, restaurantId?: string): Promise<Order[]> {
    const query = this.ordersRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.menu', 'menu')
      .leftJoinAndSelect('order.restaurant', 'restaurant')
      .leftJoinAndSelect('order.client', 'client');

    if (userId) {
      query.where('order.clientId = :userId', { userId });
    }

    if (restaurantId) {
      query.andWhere('order.restaurantId = :restaurantId', { restaurantId });
    }

    return query.orderBy('order.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items', 'items.menu', 'restaurant', 'client'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    Object.assign(order, updateOrderDto);
    return this.ordersRepository.save(order);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    order.status = status;
    return this.ordersRepository.save(order);
  }

  async cancel(id: string, userId: string): Promise<Order> {
    const order = await this.findOne(id);

    if (order.clientId !== userId) {
      throw new BadRequestException('You can only cancel your own orders');
    }

    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot cancel this order');
    }

    // Restore menu quantities
    for (const item of order.items) {
      const menu = await this.menusService.findOne(item.menuId);
      await this.menusService.update(
        menu.id,
        {
          quantity: menu.quantity + item.quantity,
          totalSold: menu.totalSold - item.quantity,
        },
        '',
        null as any,
      );
    }

    order.status = OrderStatus.CANCELLED;
    return this.ordersRepository.save(order);
  }
}

