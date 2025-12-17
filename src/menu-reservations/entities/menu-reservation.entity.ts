import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Menu } from '../../menus/entities/menu.entity';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';

export enum MenuReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('menu_reservations')
@Index(['menuId', 'clientId'])
@Index(['restaurantId', 'date'])
export class MenuReservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date; // Fecha para la cual se reserva el menú

  @Column()
  quantity: number; // Cantidad reservada

  @Column({
    type: 'enum',
    enum: MenuReservationStatus,
    default: MenuReservationStatus.PENDING,
  })
  status: MenuReservationStatus;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column()
  clientId: string;

  @ManyToOne(() => Menu, (menu) => menu.orderItems)
  @JoinColumn({ name: 'menuId' })
  menu: Menu;

  @Column()
  menuId: string;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @Column()
  restaurantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

