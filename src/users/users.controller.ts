import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, ProviderStatus } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    if (req.user.role !== Role.ADMIN && req.user.id !== id) {
      throw new ForbiddenException('Access denied');
    }
    const user = await this.usersService.findOne(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: any,
    @Request() req: any,
  ) {
    if (req.user.role !== Role.ADMIN && req.user.id !== id) {
      throw new ForbiddenException('Access denied');
    }
    return this.usersService.update(id, updateDto);
  }

  /** Admin: approve or reject a provider account */
  @Patch(':id/provider-status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async setProviderStatus(@Param('id') id: string, @Body() dto: { status: ProviderStatus }) {
    if (![ProviderStatus.APPROVED, ProviderStatus.REJECTED, ProviderStatus.PENDING].includes(dto.status)) {
      throw new ForbiddenException('Invalid provider status');
    }
    return this.usersService.setProviderStatus(id, dto.status);
  }

  /** Delete account: self or admin */
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    if (req.user.role !== Role.ADMIN && req.user.id !== id) {
      throw new ForbiddenException('Access denied');
    }
    await this.usersService.remove(id);
    return { deleted: true };
  }

  @Patch(':id/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
          cb(null, unique + extname(file.originalname));
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\//)) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (req.user.role !== Role.ADMIN && req.user.id !== id) {
      throw new ForbiddenException('Access denied');
    }
    if (!file) throw new NotFoundException('No file uploaded');
    const avatarUrl = `/uploads/${file.filename}`;
    const user = await this.usersService.update(id, { avatarUrl } as any);
    return { avatarUrl, user };
  }
}