import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
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
}
