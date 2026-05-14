import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Role } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    // Seed admin user
    const adminEmail = 'maarijwaseem7@gmail.com';
    const existingAdmin = await this.findByEmail(adminEmail);
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('123456', 10);
      const admin = this.usersRepository.create({
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
        name: 'Admin User',
      });
      await this.usersRepository.save(admin);
      console.log('Admin user seeded successfully.');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }
}
