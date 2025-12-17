import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';

export enum MenuItemType {
  FOOD = 'food',
  DRINK = 'drink',
  COMBO = 'combo',
  DESSERT = 'dessert',
}

@Entity('menus')
@Index(['restaurantId', 'date'])
export class Menu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  image: string;

  @Column({
    type: 'enum',
    enum: MenuItemType,
    default: MenuItemType.FOOD,
  })
  type: MenuItemType;

  @Column({ default: true })
  available: boolean;

  @Column({ default: 0 })
  quantity: number; // Cantidad disponible

  @Column({ default: 0 })
  totalSold: number; // Total vendido (para analytics)

  @Column({ type: 'date' })
  date: Date; // Fecha del menú

  @Column({ default: false })
  isPromoted: boolean;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menus)
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @Column()
  restaurantId: string;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.menu)
  orderItems: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

