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
import { User } from '../../users/entities/user.entity';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { SaleItem } from './sale-item.entity';

export enum SaleStatus {
  PENDING = 'pending',           // Venta creada, esperando confirmación
  CONFIRMED = 'confirmed',       // Venta confirmada, enviada a cocina
  PREPARING = 'preparing',       // Cocina preparando
  READY = 'ready',               // Listo para entregar
  DELIVERED = 'delivered',       // Entregado al cliente
  CANCELLED = 'cancelled',       // Cancelada
}

@Entity('sales')
@Index(['restaurantId', 'createdAt'])
@Index(['cashierId', 'createdAt'])
@Index(['status'])
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({
    type: 'enum',
    enum: SaleStatus,
    default: SaleStatus.PENDING,
  })
  status: SaleStatus;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ nullable: true })
  tableNumber: string; // Número de mesa para servicio en restaurante

  @Column({ nullable: true })
  customerName: string; // Nombre del cliente (para ventas presenciales)

  // Vendedor que realizó la venta
  @ManyToOne(() => User)
  @JoinColumn({ name: 'cashierId' })
  cashier: User;

  @Column()
  cashierId: string;

  // Restaurante
  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @Column()
  restaurantId: string;

  // Items de la venta (comanda)
  @OneToMany(() => SaleItem, (saleItem) => saleItem.sale, { cascade: true, eager: true })
  items: SaleItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
