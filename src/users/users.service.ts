import { Injectable, Logger, OnModuleInit, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Role } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    const sampleEmails = [
      'maarijwaseem7@gmail.com',
      'ali.provider@demo.com',
      'sara.provider@demo.com',
      'bilal.provider@demo.com',
    ];
    const existing = await this.usersRepository.find({
      where: sampleEmails.map((email) => ({ email })),
      select: ['email'],
    });
    const existingSet = new Set(existing.map((u) => u.email));

    const toSeed: Array<{ email: string; name: string; role: Role; phoneNumber?: string }> = [
      { email: 'maarijwaseem7@gmail.com', name: 'Admin User', role: Role.ADMIN },
      { email: 'ali.provider@demo.com', name: 'Ali Hassan', role: Role.PROVIDER, phoneNumber: '+92-300-1234567' },
      { email: 'sara.provider@demo.com', name: 'Sara Khan', role: Role.PROVIDER, phoneNumber: '+92-321-9876543' },
      { email: 'bilal.provider@demo.com', name: 'Bilal Ahmed', role: Role.PROVIDER, phoneNumber: '+92-333-5556677' },
    ].filter((u) => !existingSet.has(u.email));

    if (toSeed.length === 0) return;

    const passwordHash = await bcrypt.hash('123456', 10);
    await this.usersRepository.save(
      toSeed.map((u) => this.usersRepository.create({ ...u, passwordHash })),
    );
    this.logger.log(`Seeded ${toSeed.length} user(s).`);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'email', 'name', 'role', 'phoneNumber', 'city', 'avatarUrl', 'createdAt'],
    });
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'role', 'phoneNumber', 'city', 'address', 'avatarUrl', 'createdAt', 'updatedAt'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    // Never allow passwordHash or role to be changed via this method
    const { passwordHash: _pw, role: _role, ...safe } = data as any;
    await this.usersRepository.update(id, safe);
    return this.findOne(id);
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Current password is incorrect');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.update(id, { passwordHash });
  }
}
