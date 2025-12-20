import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { EventsService } from '../events/events.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
    private eventsService: EventsService,
  ) {}

  async create(createReservationDto: CreateReservationDto, clientId: string): Promise<Reservation> {
    const reservation = this.reservationsRepository.create({
      ...createReservationDto,
      clientId,
      numberOfGuests: createReservationDto.numberOfGuests || 1,
      time: createReservationDto.time || '12:00',
    });

    const savedReservation = await this.reservationsRepository.save(reservation);
    
    // Cargar relaciones para enviar al socket
    const reservationWithRelations = await this.reservationsRepository.findOne({
      where: { id: savedReservation.id },
      relations: ['client', 'restaurant'],
    });

    // Notificar al owner del restaurante en tiempo real via SSE
    if (reservationWithRelations) {
      console.log(`📅 Emitiendo evento reservation:new para restaurante ${reservationWithRelations.restaurantId}`);
      
      // Emit via SSE
      this.eventsService.emitNewReservation(
        reservationWithRelations.restaurantId,
        reservationWithRelations,
      );
      
      // Also emit via socket for backward compatibility (can be removed later)
      this.notificationsGateway.notifyNewReservation(
        reservationWithRelations.restaurantId,
        reservationWithRelations,
      );
    }

    return reservationWithRelations || savedReservation;
  }

  async findAll(restaurantId?: string, clientId?: string): Promise<Reservation[]> {
    const query = this.reservationsRepository.createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.client', 'client')
      .leftJoinAndSelect('reservation.restaurant', 'restaurant');

    if (restaurantId) {
      query.where('reservation.restaurantId = :restaurantId', { restaurantId });
    }

    if (clientId) {
      query.andWhere('reservation.clientId = :clientId', { clientId });
    }

    return query.orderBy('reservation.date', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Reservation> {
    const reservation = await this.reservationsRepository.findOne({
      where: { id },
      relations: ['client', 'restaurant'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    return reservation;
  }

  async update(id: string, updateReservationDto: UpdateReservationDto): Promise<Reservation> {
    const reservation = await this.findOne(id);
    Object.assign(reservation, updateReservationDto);
    return this.reservationsRepository.save(reservation);
  }

  async updateStatus(id: string, status: ReservationStatus): Promise<Reservation> {
    const reservation = await this.findOne(id);
    reservation.status = status;
    return this.reservationsRepository.save(reservation);
  }

  async remove(id: string, userId: string): Promise<void> {
    const reservation = await this.findOne(id);

    if (reservation.clientId !== userId) {
      throw new ForbiddenException('You can only cancel your own reservations');
    }

    await this.reservationsRepository.remove(reservation);
  }
}

