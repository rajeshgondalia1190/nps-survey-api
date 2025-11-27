import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Customer, CustomerSegment } from './entities/customer.entity';
import { SurveyResponse } from '../responses/entities/survey-response.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { ImportCustomersDto } from './dto/import-customers.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(SurveyResponse)
    private responsesRepository: Repository<SurveyResponse>,
  ) {}

  async create(organizationId: string, createDto: CreateCustomerDto): Promise<Customer> {
    // Check if customer with email already exists
    const existing = await this.customersRepository.findOne({
      where: { organizationId, email: createDto.email },
    });

    if (existing) {
      throw new ConflictException('Customer with this email already exists');
    }

    const customer = this.customersRepository.create({
      ...createDto,
      organizationId,
    });

    return this.customersRepository.save(customer);
  }

  async findAll(
    organizationId: string,
    query: CustomerQueryDto,
  ): Promise<{ customers: Customer[]; total: number }> {
    const {
      segment,
      search,
      tags,
      hasResponded,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
    } = query;

    const queryBuilder = this.customersRepository
      .createQueryBuilder('customer')
      .where('customer.organizationId = :organizationId', { organizationId });

    if (segment) {
      if (segment === 'no_response') {
        queryBuilder.andWhere('customer.segment IS NULL');
      } else {
        queryBuilder.andWhere('customer.segment = :segment', { segment });
      }
    }

    if (search) {
      queryBuilder.andWhere(
        '(customer.name ILIKE :search OR customer.email ILIKE :search OR customer.company ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (tags && tags.length > 0) {
      queryBuilder.andWhere('customer.tags && :tags', { tags });
    }

    if (hasResponded !== undefined) {
      if (hasResponded) {
        queryBuilder.andWhere('customer.totalResponses > 0');
      } else {
        queryBuilder.andWhere('customer.totalResponses = 0');
      }
    }

    queryBuilder.orderBy(`customer.${sortBy}`, sortOrder as 'ASC' | 'DESC');
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [customers, total] = await queryBuilder.getManyAndCount();

    return { customers, total };
  }

  async findById(id: string, organizationId: string): Promise<Customer> {
    const customer = await this.customersRepository.findOne({
      where: { id, organizationId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async findByEmail(email: string, organizationId: string): Promise<Customer | null> {
    return this.customersRepository.findOne({
      where: { email, organizationId },
    });
  }

  async findWithResponses(id: string, organizationId: string): Promise<Customer> {
    const customer = await this.findById(id, organizationId);

    customer.responses = await this.responsesRepository.find({
      where: { customerId: id },
      relations: ['survey'],
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return customer;
  }

  async update(id: string, organizationId: string, updateDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findById(id, organizationId);

    // Check email uniqueness if changing
    if (updateDto.email && updateDto.email !== customer.email) {
      const existing = await this.findByEmail(updateDto.email, organizationId);
      if (existing) {
        throw new ConflictException('Customer with this email already exists');
      }
    }

    Object.assign(customer, updateDto);
    return this.customersRepository.save(customer);
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const customer = await this.findById(id, organizationId);
    await this.customersRepository.remove(customer);
  }

  async bulkDelete(ids: string[], organizationId: string): Promise<number> {
    const result = await this.customersRepository.delete({
      id: In(ids),
      organizationId,
    });
    return result.affected || 0;
  }

  async addTags(id: string, organizationId: string, tags: string[]): Promise<Customer> {
    const customer = await this.findById(id, organizationId);
    const existingTags = customer.tags || [];
    const newTags = [...new Set([...existingTags, ...tags])];
    customer.tags = newTags;
    return this.customersRepository.save(customer);
  }

  async removeTags(id: string, organizationId: string, tags: string[]): Promise<Customer> {
    const customer = await this.findById(id, organizationId);
    const existingTags = customer.tags || [];
    customer.tags = existingTags.filter((t) => !tags.includes(t));
    return this.customersRepository.save(customer);
  }

  async bulkAddTags(ids: string[], organizationId: string, tags: string[]): Promise<number> {
    let updated = 0;
    for (const id of ids) {
      try {
        await this.addTags(id, organizationId, tags);
        updated++;
      } catch (e) {
        // Continue with others
      }
    }
    return updated;
  }

  async importCustomers(
    organizationId: string,
    importDto: ImportCustomersDto,
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const customerData of importDto.customers) {
      try {
        // Check if exists
        const existing = await this.findByEmail(customerData.email, organizationId);
        if (existing) {
          if (importDto.updateExisting) {
            await this.update(existing.id, organizationId, customerData);
            imported++;
          } else {
            skipped++;
          }
          continue;
        }

        // Create new
        await this.create(organizationId, customerData);
        imported++;
      } catch (e) {
        errors.push(`Failed to import ${customerData.email}: ${e.message}`);
      }
    }

    return { imported, skipped, errors };
  }

  async getStats(organizationId: string): Promise<{
    total: number;
    promoters: number;
    passives: number;
    detractors: number;
    noResponse: number;
  }> {
    const stats = await this.customersRepository
      .createQueryBuilder('customer')
      .select('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN customer.segment = :promoter THEN 1 ELSE 0 END)', 'promoters')
      .addSelect('SUM(CASE WHEN customer.segment = :passive THEN 1 ELSE 0 END)', 'passives')
      .addSelect('SUM(CASE WHEN customer.segment = :detractor THEN 1 ELSE 0 END)', 'detractors')
      .addSelect('SUM(CASE WHEN customer.segment IS NULL THEN 1 ELSE 0 END)', 'noResponse')
      .where('customer.organizationId = :organizationId', { organizationId })
      .setParameters({
        promoter: CustomerSegment.PROMOTER,
        passive: CustomerSegment.PASSIVE,
        detractor: CustomerSegment.DETRACTOR,
      })
      .getRawOne();

    return {
      total: parseInt(stats.total) || 0,
      promoters: parseInt(stats.promoters) || 0,
      passives: parseInt(stats.passives) || 0,
      detractors: parseInt(stats.detractors) || 0,
      noResponse: parseInt(stats.noResponse) || 0,
    };
  }

  async getAllTags(organizationId: string): Promise<string[]> {
    const customers = await this.customersRepository.find({
      where: { organizationId },
      select: ['tags'],
    });

    const allTags = new Set<string>();
    customers.forEach((c) => {
      if (c.tags) {
        c.tags.forEach((t) => allTags.add(t));
      }
    });

    return Array.from(allTags).sort();
  }

  async exportCustomers(organizationId: string, query?: CustomerQueryDto): Promise<Customer[]> {
    const { customers } = await this.findAll(organizationId, {
      ...query,
      page: 1,
      limit: 10000, // Max export limit
    });
    return customers;
  }
}
