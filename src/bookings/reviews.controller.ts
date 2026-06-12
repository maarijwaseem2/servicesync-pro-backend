import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/entities/user.entity';

function toReviewDto(b: Booking) {
  return {
    id: b.id,
    rating: b.rating,
    reviewText: b.reviewText,
    reviewHidden: b.reviewHidden,
    date: b.updatedAt,
    bookingDate: b.date,
    customer: b.customer
      ? { id: b.customer.id, name: b.customer.name, avatarUrl: b.customer.avatarUrl }
      : null,
    provider: b.provider ? { id: b.provider.id, name: b.provider.name } : null,
    service: b.service ? { id: b.service.id, title: b.service.title } : null,
  };
}

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /** Public: all visible reviews */
  @Get()
  async findAll() {
    const reviews = await this.bookingsService.findReviews();
    return reviews.map(toReviewDto);
  }

  /** Admin: all reviews including hidden ones, for moderation */
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async findAllAdmin() {
    const reviews = await this.bookingsService.findReviews({ includeHidden: true });
    return reviews.map(toReviewDto);
  }

  /** Public: visible reviews for one service */
  @Get('service/:serviceId')
  async findByService(@Param('serviceId') serviceId: string) {
    const reviews = await this.bookingsService.findReviews({ serviceId });
    return reviews.map(toReviewDto);
  }

  /** Public: completed jobs + average rating for a provider */
  @Get('provider-stats/:providerId')
  getProviderStats(@Param('providerId') providerId: string) {
    return this.bookingsService.getProviderStats(providerId);
  }
}
