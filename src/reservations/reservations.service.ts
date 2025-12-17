import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
  ) {}

  async create(createReservationDto: CreateReservationDto, clientId: string): Promise<Reservation> {
    const reservation = this.reservationsRepository.create({
      ...createReservationDto,
      clientId,
    });

    return this.reservationsRepository.save(reservation);
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

