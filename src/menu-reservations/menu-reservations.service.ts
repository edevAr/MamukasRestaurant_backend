import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuReservation, MenuReservationStatus } from './entities/menu-reservation.entity';
import { CreateMenuReservationDto } from './dto/create-menu-reservation.dto';
import { MenusService } from '../menus/menus.service';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class MenuReservationsService {
  constructor(
    @InjectRepository(MenuReservation)
    private menuReservationsRepository: Repository<MenuReservation>,
    private menusService: MenusService,
  ) {}

  async create(createMenuReservationDto: CreateMenuReservationDto, clientId: string): Promise<MenuReservation> {
    const menu = await this.menusService.findOne(createMenuReservationDto.menuId);

    // Verificar disponibilidad
    if (!menu.available) {
      throw new BadRequestException('Este plato no está disponible');
    }

    if (menu.quantity < createMenuReservationDto.quantity) {
      throw new BadRequestException(`Solo hay ${menu.quantity} unidades disponibles`);
    }

    // Verificar si el cliente ya tiene una reserva pendiente para este menú en esta fecha
    const existingReservation = await this.menuReservationsRepository.findOne({
      where: {
        menuId: createMenuReservationDto.menuId,
        clientId,
        date: new Date(createMenuReservationDto.date),
        status: MenuReservationStatus.PENDING,
      },
    });

    if (existingReservation) {
      throw new BadRequestException('Ya tienes una reserva pendiente para este plato en esta fecha');
    }

    const reservation = this.menuReservationsRepository.create({
      ...createMenuReservationDto,
      clientId,
      restaurantId: menu.restaurantId,
      date: new Date(createMenuReservationDto.date),
    });

    return this.menuReservationsRepository.save(reservation);
  }

  async findAll(restaurantId?: string, clientId?: string): Promise<MenuReservation[]> {
    const query = this.menuReservationsRepository.createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.client', 'client')
      .leftJoinAndSelect('reservation.menu', 'menu')
      .leftJoinAndSelect('reservation.restaurant', 'restaurant');

    if (restaurantId) {
      query.where('reservation.restaurantId = :restaurantId', { restaurantId });
    }

    if (clientId) {
      query.andWhere('reservation.clientId = :clientId', { clientId });
    }

    return query
      .orderBy('reservation.date', 'DESC')
      .addOrderBy('reservation.createdAt', 'DESC')
      .getMany();
  }

  async findByMenuAndClient(menuId: string, clientId: string, date: string): Promise<MenuReservation | null> {
    return this.menuReservationsRepository.findOne({
      where: {
        menuId,
        clientId,
        date: new Date(date),
        status: MenuReservationStatus.PENDING,
      },
    });
  }

  async findOne(id: string): Promise<MenuReservation> {
    const reservation = await this.menuReservationsRepository.findOne({
      where: { id },
      relations: ['client', 'menu', 'restaurant'],
    });

    if (!reservation) {
      throw new NotFoundException(`Menu reservation with ID ${id} not found`);
    }

    return reservation;
  }

  async cancel(id: string, userId: string, userRole: Role): Promise<void> {
    const reservation = await this.findOne(id);

    // Solo el cliente puede cancelar su propia reserva, o el dueño/admin
    if (userRole === Role.CLIENT && reservation.clientId !== userId) {
      throw new ForbiddenException('You can only cancel your own reservations');
    }

    reservation.status = MenuReservationStatus.CANCELLED;
    await this.menuReservationsRepository.save(reservation);
  }

  async updateStatus(id: string, status: MenuReservationStatus): Promise<MenuReservation> {
    const reservation = await this.findOne(id);
    reservation.status = status;
    return this.menuReservationsRepository.save(reservation);
  }

  async getReservationCount(restaurantId: string, date?: Date): Promise<number> {
    const query = this.menuReservationsRepository.createQueryBuilder('reservation')
      .where('reservation.restaurantId = :restaurantId', { restaurantId })
      .andWhere('reservation.status = :status', { status: MenuReservationStatus.PENDING });

    if (date) {
      query.andWhere('reservation.date = :date', { date });
    }

    return query.getCount();
  }
}

