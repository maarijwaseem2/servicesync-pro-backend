import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async findAll(role: string, userId: string): Promise<Booking[]> {
    const options: any = { relations: ['customer', 'provider', 'service'] };
    if (role === 'CUSTOMER') {
      options.where = { customer: { id: userId } };
    } else if (role === 'PROVIDER') {
      options.where = { provider: { id: userId } };
    }
    return this.bookingRepository.find(options);
  }

  async findOne(id: string): Promise<Booking | null> {
    return this.bookingRepository.findOne({
      where: { id },
      relations: ['customer', 'provider', 'service'],
    });
  }

  async create(createBookingDto: any, customerId: string): Promise<Booking> {
    const booking = this.bookingRepository.create({
      ...createBookingDto,
      customer: { id: customerId },
      service: { id: createBookingDto.serviceId },
      provider: createBookingDto.providerId ? { id: createBookingDto.providerId } : null,
    });
    return this.bookingRepository.save(booking as any) as unknown as Booking;
  }

  async updateStatus(id: string, updateDto: any): Promise<Booking | null> {
    await this.bookingRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async submitReview(id: string, rating: number, reviewText: string): Promise<Booking | null> {
    await this.bookingRepository.update(id, { rating, reviewText });
    return this.findOne(id);
  }
}
