import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from './src/users/entities/user.entity';
import { ServiceEntity } from './src/services/entities/service.entity';
import { Booking } from './src/bookings/entities/booking.entity';
import { Category } from './src/categories/entities/category.entity';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'servicesync',
  entities: [User, ServiceEntity, Booking, Category],
  migrations: ['src/migrations/*.ts'],
});
