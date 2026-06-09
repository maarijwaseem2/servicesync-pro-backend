import { Injectable, Logger, OnModuleInit, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from './entities/service.entity';
import { User, Role } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class ServicesService implements OnModuleInit {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    @InjectRepository(ServiceEntity)
    private readonly serviceRepository: Repository<ServiceEntity>,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit() {
    const count = await this.serviceRepository.count();
    if (count > 0) return;

    const providers = (await this.usersService.findAll()).filter(
      (u) => u.role === Role.PROVIDER,
    );
    if (providers.length === 0) return;

    const samples = [
      { title: 'Deep Home Cleaning', description: 'Full home deep cleaning service including all rooms, kitchen, and bathrooms.', price: 89, status: 'active' },
      { title: 'Electrical Wiring Fix', description: 'Professional electrical fault diagnosis and repair.', price: 65, status: 'active' },
      { title: 'Plumbing Repair', description: 'Fix leaks, blockages, and pipe replacements by certified plumbers.', price: 75, status: 'active' },
      { title: 'Interior Painting', description: 'High-quality interior wall painting with premium paints.', price: 120, status: 'active' },
      { title: 'AC Service & Repair', description: 'AC maintenance, gas refilling, and repair service.', price: 55, status: 'active' },
      { title: 'Furniture Assembly', description: 'Professional assembly of all types of furniture.', price: 45, status: 'active' },
    ];

    await this.serviceRepository.save(
      samples.map((s, i) => this.serviceRepository.create({ ...s, provider: providers[i % providers.length] })),
    );
    this.logger.log('Sample services seeded.');
  }

  /** Public: only active services */
  async findAll(): Promise<ServiceEntity[]> {
    return this.serviceRepository.find({
      where: { status: 'active' },
      relations: ['provider', 'category'],
    });
  }

  /** Admin: all services regardless of status */
  async findAllAdmin(): Promise<ServiceEntity[]> {
    return this.serviceRepository.find({ relations: ['provider', 'category'] });
  }

  /** Provider: their own services (all statuses) */
  async findByProvider(providerId: string): Promise<ServiceEntity[]> {
    return this.serviceRepository.find({
      where: { provider: { id: providerId } },
      relations: ['provider', 'category'],
    });
  }

  async findOne(id: string): Promise<ServiceEntity | null> {
    return this.serviceRepository.findOne({ where: { id }, relations: ['provider', 'category'] });
  }

  /** When a PROVIDER creates a service it starts as 'pending'; ADMIN creations are active immediately */
  async create(createServiceDto: any, creator: User): Promise<ServiceEntity> {
    const status = creator.role === Role.ADMIN ? 'active' : 'pending';
    const service = this.serviceRepository.create({ ...createServiceDto, provider: creator, status });
    return this.serviceRepository.save(service as any) as unknown as ServiceEntity;
  }

  async update(id: string, updateServiceDto: any): Promise<ServiceEntity | null> {
    await this.serviceRepository.update(id, updateServiceDto);
    return this.findOne(id);
  }

  async approve(id: string): Promise<ServiceEntity | null> {
    await this.serviceRepository.update(id, { status: 'active' });
    return this.findOne(id);
  }

  async reject(id: string): Promise<ServiceEntity | null> {
    await this.serviceRepository.update(id, { status: 'rejected' });
    return this.findOne(id);
  }

  async remove(id: string, requestingUser: User): Promise<void> {
    const service = await this.serviceRepository.findOne({ where: { id }, relations: ['provider'] });
    if (!service) throw new NotFoundException('Service not found');
    if (requestingUser.role !== Role.ADMIN && service.provider?.id !== requestingUser.id) {
      throw new ForbiddenException('You can only delete your own services');
    }
    await this.serviceRepository.delete(id);
  }
}
