import { Injectable, Logger, OnModuleInit, UnauthorizedException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User, Role, ProviderStatus } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

/** Capitalize the first letter of each word in a name */
export function capitalizeName(name?: string | null): string | undefined {
  if (!name) return name ?? undefined;
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Phone numbers must be exactly 11 digits, no letters or symbols. Throws on invalid. */
export function validatePhone(phone?: string | null): void {
  if (phone === undefined || phone === null || phone === '') return;
  if (!/^\d{11}$/.test(String(phone).trim())) {
    throw new BadRequestException('Phone number must be exactly 11 digits (numbers only).');
  }
}

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
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
      select: ['id', 'email', 'name', 'role', 'phoneNumber', 'city', 'avatarUrl', 'providerStatus', 'createdAt'],
    });
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'role', 'phoneNumber', 'city', 'address', 'avatarUrl', 'providerStatus', 'availability', 'category', 'serviceArea', 'bio', 'experienceYears', 'createdAt', 'updatedAt'],
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
    // Never allow passwordHash, role, or providerStatus to be changed via this method
    const { passwordHash: _pw, role: _role, providerStatus: _ps, ...safe } = data as any;
    if (safe.name) safe.name = capitalizeName(safe.name);
    if (safe.phoneNumber !== undefined) validatePhone(safe.phoneNumber);
    await this.usersRepository.update(id, safe);
    return this.findOne(id);
  }

  async setProviderStatus(id: string, status: ProviderStatus): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== Role.PROVIDER) {
      throw new ForbiddenException('Only provider accounts have an approval status');
    }
    await this.usersRepository.update(id, { providerStatus: status });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === Role.ADMIN) {
      throw new ForbiddenException('Admin accounts cannot be deleted');
    }
    // Clean up records that reference this user before deleting it
    await this.dataSource.transaction(async (manager) => {
      await manager.query(`DELETE FROM "booking" WHERE "customerId" = $1`, [id]);
      await manager.query(
        `DELETE FROM "booking" WHERE "serviceId" IN (SELECT "id" FROM "service_entity" WHERE "providerId" = $1)`,
        [id],
      );
      await manager.query(`UPDATE "booking" SET "providerId" = NULL WHERE "providerId" = $1`, [id]);
      await manager.query(`DELETE FROM "service_entity" WHERE "providerId" = $1`, [id]);
      await manager.query(`DELETE FROM "user" WHERE "id" = $1`, [id]);
    });
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
