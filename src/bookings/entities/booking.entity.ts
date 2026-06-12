import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ServiceEntity } from '../../services/entities/service.entity';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  customer: User;

  @ManyToOne(() => User, { nullable: true })
  provider: User;

  @ManyToOne(() => ServiceEntity)
  service: ServiceEntity;

  @Column()
  date: string;

  @Column()
  time: string;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  totalAmount: number;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  phone: string;

  @Column('text', { nullable: true })
  specialInstructions: string;

  @Column('int', { nullable: true })
  rating: number;

  @Column('text', { nullable: true })
  reviewText: string;

  @Column({ default: false })
  reviewHidden: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
