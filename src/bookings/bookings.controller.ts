import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, Request, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.bookingsService.findAll(req.user.role, req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const booking = await this.bookingsService.findOne(id);
    if (!booking) throw new NotFoundException();
    const { role, id: userId } = req.user;
    if (role === Role.CUSTOMER && booking.customer?.id !== userId) throw new ForbiddenException();
    if (role === Role.PROVIDER && booking.provider?.id !== userId) throw new ForbiddenException();
    return booking;
  }

  @Roles(Role.CUSTOMER)
  @Post()
  create(@Body() createBookingDto: any, @Request() req: any) {
    return this.bookingsService.create(createBookingDto, req.user.id);
  }

  @Roles(Role.ADMIN, Role.PROVIDER)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() updateDto: any) {
    return this.bookingsService.updateStatus(id, updateDto);
  }

  @Roles(Role.CUSTOMER)
  @Patch(':id/review')
  async submitReview(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
    const booking = await this.bookingsService.findOne(id);
    if (!booking) throw new NotFoundException();
    if (booking.customer?.id !== req.user.id) throw new ForbiddenException();
    return this.bookingsService.submitReview(id, dto.rating, dto.reviewText);
  }

  /** Admin: hide or unhide a customer review */
  @Roles(Role.ADMIN)
  @Patch(':id/review/visibility')
  setReviewVisibility(@Param('id') id: string, @Body() dto: { hidden: boolean }) {
    return this.bookingsService.setReviewVisibility(id, !!dto.hidden);
  }

  /** Admin: delete a booking */
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.bookingsService.remove(id);
    return { deleted: true };
  }
}
