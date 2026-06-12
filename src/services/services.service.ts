import { Injectable, Logger, OnModuleInit, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from './entities/service.entity';
import { User, Role, ProviderStatus } from '../users/entities/user.entity';
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

  /** Never expose password hashes through the joined provider relation */
  private sanitize<T extends ServiceEntity | null>(service: T): T {
    if (service?.provider) delete (service.provider as any).passwordHash;
    return service;
  }

  /** Public: only active services from approved (or admin-created) providers */
  async findAll(): Promise<ServiceEntity[]> {
    const services = await this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.provider', 'provider')
      .leftJoinAndSelect('service.category', 'category')
      .where('service.status = :status', { status: 'active' })
      .andWhere(
        '(provider.id IS NULL OR provider.role = :adminRole OR provider.providerStatus = :approved)',
        { adminRole: Role.ADMIN, approved: ProviderStatus.APPROVED },
      )
      .getMany();
    return services.map((s) => this.sanitize(s));
  }

  /** Admin: all services regardless of status */
  async findAllAdmin(): Promise<ServiceEntity[]> {
    const services = await this.serviceRepository.find({ relations: ['provider', 'category'] });
    return services.map((s) => this.sanitize(s));
  }

  /** Provider: their own services (all statuses) */
  async findByProvider(providerId: string): Promise<ServiceEntity[]> {
    const services = await this.serviceRepository.find({
      where: { provider: { id: providerId } },
      relations: ['provider', 'category'],
    });
    return services.map((s) => this.sanitize(s));
  }

  async findOne(id: string): Promise<ServiceEntity | null> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['provider', 'category'],
    });
    return this.sanitize(service);
  }

  /** When a PROVIDER creates a service it starts as 'pending'; ADMIN creations are active immediately */
  async create(createServiceDto: any, creator: User): Promise<ServiceEntity> {
    if (creator.role === Role.PROVIDER) {
      const dbUser = await this.usersService.findOne(creator.id);
      if (dbUser?.providerStatus !== ProviderStatus.APPROVED) {
        throw new ForbiddenException(
          'Your provider account is awaiting admin approval. You can add services once approved.',
        );
      }
    }
    const status = creator.role === Role.ADMIN ? 'active' : 'pending';
    const { categoryId, ...rest } = createServiceDto;
    const service = this.serviceRepository.create({
      ...rest,
      ...(categoryId ? { category: { id: categoryId } } : {}),
      provider: creator,
      status,
    });
    return this.serviceRepository.save(service as any) as unknown as ServiceEntity;
  }

  async update(id: string, updateServiceDto: any, requestingUser?: User): Promise<ServiceEntity | null> {
    const existing = await this.serviceRepository.findOne({ where: { id }, relations: ['provider'] });
    if (!existing) throw new NotFoundException('Service not found');
    if (requestingUser && requestingUser.role !== Role.ADMIN && existing.provider?.id !== requestingUser.id) {
      throw new ForbiddenException('You can only edit your own services');
    }
    const { categoryId, provider: _p, status: _s, ...rest } = updateServiceDto;
    const patch: any = { ...rest };
    if (categoryId !== undefined) {
      patch.category = categoryId ? { id: categoryId } : null;
    }
    await this.serviceRepository.save({ id, ...patch });
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
