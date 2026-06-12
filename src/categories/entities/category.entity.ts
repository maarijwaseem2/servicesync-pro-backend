import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ServiceEntity } from '../../services/entities/service.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  color: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => ServiceEntity, (service) => service.category)
  services: ServiceEntity[];
}
