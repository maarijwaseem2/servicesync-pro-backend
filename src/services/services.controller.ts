import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, Request, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/entities/user.entity';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  /** Public: only active services */
  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  /** Admin: all services including pending/rejected */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/all')
  findAllAdmin() {
    return this.servicesService.findAllAdmin();
  }

  /** Provider: their own services across all statuses */
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@Request() req: any) {
    return this.servicesService.findByProvider(req.user.id);
  }

  /** Upload an image for a service; returns { imageUrl } */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PROVIDER)
  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
          cb(null, 'service-' + unique + extname(file.originalname));
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\//)) return cb(new Error('Only image files are allowed'), false);
        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return { imageUrl: `/uploads/${file.filename}` };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PROVIDER)
  @Post()
  create(@Body() createServiceDto: any, @Request() req: any) {
    return this.servicesService.create(createServiceDto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PROVIDER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServiceDto: any, @Request() req: any) {
    return this.servicesService.update(id, updateServiceDto, req.user);
  }

  /** Admin: approve a pending service */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.servicesService.approve(id);
  }

  /** Admin: reject a pending service */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.servicesService.reject(id);
  }

  /** Admin or owning provider can delete */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PROVIDER)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.servicesService.remove(id, req.user);
  }
}

