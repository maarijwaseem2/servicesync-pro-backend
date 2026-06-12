import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { validatePhone } from '../users/users.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  /** Never expose password hashes through joined user relations */
  private sanitize<T extends Booking | null>(booking: T): T {
    if (booking?.customer) delete (booking.customer as any).passwordHash;
    if (booking?.provider) delete (booking.provider as any).passwordHash;
    return booking;
  }

  async findAll(role: string, userId: string): Promise<Booking[]> {
    const options: any = { relations: ['customer', 'provider', 'service'] };
    if (role === 'CUSTOMER') {
      options.where = { customer: { id: userId } };
    } else if (role === 'PROVIDER') {
      options.where = { provider: { id: userId } };
    }
    const bookings = await this.bookingRepository.find(options);
    return bookings.map((b) => this.sanitize(b));
  }

  async findOne(id: string): Promise<Booking | null> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['customer', 'provider', 'service'],
    });
    return this.sanitize(booking);
  }

  async create(createBookingDto: any, customerId: string): Promise<Booking> {
    validatePhone(createBookingDto.phone);
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

  async setReviewVisibility(id: string, hidden: boolean): Promise<Booking | null> {
    const booking = await this.findOne(id);
    if (!booking) throw new NotFoundException('Booking not found');
    await this.bookingRepository.update(id, { reviewHidden: hidden });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    await this.bookingRepository.delete(id);
  }

  /** All reviews (bookings with a rating). includeHidden=false for public consumption. */
  async findReviews(opts: { serviceId?: string; providerId?: string; includeHidden?: boolean } = {}): Promise<Booking[]> {
    const where: any = { rating: Not(IsNull()) };
    if (!opts.includeHidden) where.reviewHidden = false;
    if (opts.serviceId) where.service = { id: opts.serviceId };
    if (opts.providerId) where.provider = { id: opts.providerId };
    return this.bookingRepository.find({
      where,
      relations: ['customer', 'provider', 'service'],
      order: { updatedAt: 'DESC' },
    });
  }

  /** Public stats for a provider: completed jobs + average visible rating */
  async getProviderStats(providerId: string) {
    const completedJobs = await this.bookingRepository.count({
      where: { provider: { id: providerId }, status: BookingStatus.COMPLETED },
    });
    const reviews = await this.findReviews({ providerId });
    const reviewCount = reviews.length;
    const avgRating =
      reviewCount > 0
        ? Number((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount).toFixed(1))
        : null;
    return { completedJobs, reviewCount, avgRating };
  }
}
