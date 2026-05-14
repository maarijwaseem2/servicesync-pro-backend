import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from './entities/service.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly serviceRepository: Repository<ServiceEntity>,
  ) {}

  async findAll(): Promise<ServiceEntity[]> {
    return this.serviceRepository.find({ relations: ['provider', 'category'] });
  }

  async findOne(id: string): Promise<ServiceEntity | null> {
    return this.serviceRepository.findOne({ where: { id }, relations: ['provider', 'category'] });
  }

  async create(createServiceDto: any, provider: User): Promise<ServiceEntity> {
    const service = this.serviceRepository.create({
      ...createServiceDto,
      provider,
    });
    return this.serviceRepository.save(service as any) as unknown as ServiceEntity;
  }

  async update(id: string, updateServiceDto: any): Promise<ServiceEntity | null> {
    await this.serviceRepository.update(id, updateServiceDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.serviceRepository.delete(id);
  }
}
