import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService, capitalizeName } from '../users/users.service';
import { ProviderStatus } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    return { access_token: await this.jwtService.signAsync(payload) };
  }

  async signUp(email: string, pass: string, role: string, name: string): Promise<any> {
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new UnauthorizedException('Email already exists');
    if (role === 'ADMIN') throw new UnauthorizedException('Cannot register as Admin');
    const passwordHash = await bcrypt.hash(pass, 10);
    const user = await this.usersService.create({
      email,
      passwordHash,
      role: role as any,
      name: capitalizeName(name),
      // New providers must be approved by an admin before their services go live
      providerStatus: role === 'PROVIDER' ? ProviderStatus.PENDING : undefined,
    });
    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    return { access_token: await this.jwtService.signAsync(payload) };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    await this.usersService.changePassword(userId, currentPassword, newPassword);
    return { message: 'Password changed successfully' };
  }
}
