import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/entities/user.entity';
import { ServiceEntity } from './services/entities/service.entity';
import { Booking } from './bookings/entities/booking.entity';
import { Category } from './categories/entities/category.entity';

import { UsersModule } from './users/users.module';
import { ServicesModule } from './services/services.module';
import { BookingsModule } from './bookings/bookings.module';
import { CategoriesModule } from './categories/categories.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(
      process.env.DB_URL
        ? {
            type: 'postgres',
            url: process.env.DB_URL,
            ssl: { rejectUnauthorized: false },
            entities: [User, ServiceEntity, Booking, Category],
            migrations: [__dirname + '/migrations/*{.ts,.js}'],
            migrationsRun: true,
            synchronize: false,
          }
        : {
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASS || '123456',
            database: process.env.DB_NAME || 'servicesync',
            ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost'
              ? { rejectUnauthorized: false }
              : false,
            entities: [User, ServiceEntity, Booking, Category],
            migrations: [__dirname + '/migrations/*{.ts,.js}'],
            migrationsRun: true,
            synchronize: false,
          },
    ),
    UsersModule,
    ServicesModule,
    BookingsModule,
    CategoriesModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
