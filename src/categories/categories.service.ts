import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async onModuleInit() {
    const defaultCategories = [
      { name: 'Cleaning', icon: 'Sparkles', color: 'from-blue-500 to-cyan-400' },
      { name: 'Repair', icon: 'Wrench', color: 'from-orange-500 to-amber-400' },
      { name: 'Painting', icon: 'Paintbrush', color: 'from-purple-500 to-pink-400' },
      { name: 'Electrical', icon: 'Zap', color: 'from-yellow-500 to-orange-400' },
      { name: 'Plumbing', icon: 'Droplets', color: 'from-cyan-500 to-blue-400' },
      { name: 'Assembly', icon: 'Hammer', color: 'from-slate-500 to-slate-400' },
      { name: 'Tailoring', icon: 'Scissors', color: 'from-rose-500 to-red-400' },
      { name: 'Gardening', icon: 'Leaf', color: 'from-green-500 to-emerald-400' },
    ];

    for (const cat of defaultCategories) {
      const exists = await this.categoryRepository.findOne({ where: { name: cat.name } });
      if (!exists) {
        await this.categoryRepository.save(this.categoryRepository.create(cat));
      }
    }
  }

  async findAll() {
    return this.categoryRepository.find({ relations: ['services'] });
  }

  async findOne(id: string) {
    return this.categoryRepository.findOne({ where: { id }, relations: ['services'] });
  }

  async create(data: Partial<Category>) {
    const category = this.categoryRepository.create(data);
    return this.categoryRepository.save(category);
  }
}
