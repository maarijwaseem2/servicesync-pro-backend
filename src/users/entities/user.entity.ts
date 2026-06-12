import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum Role {
  ADMIN = 'ADMIN',
  PROVIDER = 'PROVIDER',
  CUSTOMER = 'CUSTOMER',
}

export enum ProviderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.CUSTOMER,
  })
  role: Role;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  avatarUrl: string;

  /** Only used for PROVIDER accounts: PENDING | APPROVED | REJECTED */
  @Column({ nullable: true })
  providerStatus: string;

  /** Provider working hours/days, e.g. { acceptingJobs, days, startTime, endTime, breakStart, breakEnd } */
  @Column('jsonb', { nullable: true })
  availability: Record<string, any> | null;

  /** Provider professional details */
  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  serviceArea: string;

  @Column('text', { nullable: true })
  bio: string;

  @Column('int', { nullable: true })
  experienceYears: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
