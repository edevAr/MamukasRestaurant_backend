import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sale } from './sale.entity';
import { Menu } from '../../menus/entities/menu.entity';

export enum SaleItemStatus {
  PENDING = 'pending',       // Pendiente de preparar
  PREPARING = 'preparing',   // En preparación
  READY = 'ready',           // Listo para entregar
  DELIVERED = 'delivered',   // Entregado
}

@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Sale, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  @Column()
  saleId: string;

  // Referencia al menú
  @Column()
  menuId: string;

  @Column()
  menuName: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('text', { nullable: true })
  notes: string; // Notas especiales del item (sin cebolla, bien cocido, etc.)

  @Column({
    type: 'enum',
    enum: SaleItemStatus,
    default: SaleItemStatus.PENDING,
  })
  status: SaleItemStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
