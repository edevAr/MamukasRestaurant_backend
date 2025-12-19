import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Menu } from '../../menus/entities/menu.entity';
import { Order } from '../../orders/entities/order.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Reservation } from '../../reservations/entities/reservation.entity';
import { Promotion } from '../../promotions/entities/promotion.entity';

@Entity('restaurants')
@Index(['latitude', 'longitude'])
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: true })
  cuisine: string;

  @Column()
  address: string;

  @Column('decimal', { precision: 10, scale: 8 })
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8 })
  longitude: number;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  logo: string;

  @Column('jsonb', { nullable: true })
  openingHours: {
    [key: string]: {
      open: boolean;
      openTime?: string;
      closeTime?: string;
    };
  };

  @Column({ default: true })
  isOpen: boolean;

  @Column({ default: false })
  isActive: boolean;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  totalReviews: number;

  @Column({ default: false })
  isPromoted: boolean;

  @Column('text', { nullable: true })
  promotionText: string | null; // Texto de la publicidad

  @Column({ nullable: true })
  promotionImage: string | null; // Imagen de la publicidad

  @Column({ type: 'timestamp', nullable: true })
  promotionStartDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  promotionEndDate: Date | null;

  @ManyToOne(() => User, (user) => user.restaurants)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  // Relations
  @OneToMany(() => Menu, (menu) => menu.restaurant)
  menus: Menu[];

  @OneToMany(() => Order, (order) => order.restaurant)
  orders: Order[];

  @OneToMany(() => Review, (review) => review.restaurant)
  reviews: Review[];

  @OneToMany(() => Reservation, (reservation) => reservation.restaurant)
  reservations: Reservation[];

  @OneToMany(() => Promotion, (promotion) => promotion.restaurant)
  promotions: Promotion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

