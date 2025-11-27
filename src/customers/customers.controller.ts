import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { ImportCustomersDto } from './dto/import-customers.dto';
import { BulkActionDto } from './dto/bulk-action.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created' })
  @ApiResponse({ status: 409, description: 'Customer already exists' })
  async create(
    @CurrentUser('organizationId') organizationId: string,
    @Body() createDto: CreateCustomerDto,
  ) {
    const customer = await this.customersService.create(organizationId, createDto);
    return { customer, message: 'Customer created successfully' };
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: 200, description: 'Customers retrieved' })
  async findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: CustomerQueryDto,
  ) {
    const { customers, total } = await this.customersService.findAll(organizationId, query);
    return {
      customers,
      total,
      page: query.page || 1,
      limit: query.limit || 10,
      totalPages: Math.ceil(total / (query.limit || 10)),
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get customer statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStats(@CurrentUser('organizationId') organizationId: string) {
    const stats = await this.customersService.getStats(organizationId);
    return { stats };
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all unique tags' })
  @ApiResponse({ status: 200, description: 'Tags retrieved' })
  async getTags(@CurrentUser('organizationId') organizationId: string) {
    const tags = await this.customersService.getAllTags(organizationId);
    return { tags };
  }

  @Get('export')
  @ApiOperation({ summary: 'Export customers' })
  @ApiResponse({ status: 200, description: 'Customers exported' })
  async export(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: CustomerQueryDto,
  ) {
    const customers = await this.customersService.exportCustomers(organizationId, query);
    return { customers, total: customers.length };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer retrieved' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    const customer = await this.customersService.findById(id, organizationId);
    return { customer };
  }

  @Get(':id/responses')
  @ApiOperation({ summary: 'Get customer with survey responses' })
  @ApiResponse({ status: 200, description: 'Customer with responses retrieved' })
  async getWithResponses(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    const customer = await this.customersService.findWithResponses(id, organizationId);
    return { customer };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({ status: 200, description: 'Customer updated' })
  async update(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateCustomerDto,
  ) {
    const customer = await this.customersService.update(id, organizationId, updateDto);
    return { customer, message: 'Customer updated successfully' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete customer' })
  @ApiResponse({ status: 204, description: 'Customer deleted' })
  async delete(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    await this.customersService.delete(id, organizationId);
  }

  @Post(':id/tags')
  @ApiOperation({ summary: 'Add tags to customer' })
  @ApiResponse({ status: 200, description: 'Tags added' })
  async addTags(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body('tags') tags: string[],
  ) {
    const customer = await this.customersService.addTags(id, organizationId, tags);
    return { customer, message: 'Tags added successfully' };
  }

  @Delete(':id/tags')
  @ApiOperation({ summary: 'Remove tags from customer' })
  @ApiResponse({ status: 200, description: 'Tags removed' })
  async removeTags(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body('tags') tags: string[],
  ) {
    const customer = await this.customersService.removeTags(id, organizationId, tags);
    return { customer, message: 'Tags removed successfully' };
  }

  @Post('import')
  @ApiOperation({ summary: 'Import customers from list' })
  @ApiResponse({ status: 200, description: 'Customers imported' })
  async import(
    @CurrentUser('organizationId') organizationId: string,
    @Body() importDto: ImportCustomersDto,
  ) {
    const result = await this.customersService.importCustomers(organizationId, importDto);
    return {
      ...result,
      message: `Imported ${result.imported} customers, skipped ${result.skipped}`,
    };
  }

  @Post('bulk/delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk delete customers' })
  @ApiResponse({ status: 200, description: 'Customers deleted' })
  async bulkDelete(
    @CurrentUser('organizationId') organizationId: string,
    @Body() bulkDto: BulkActionDto,
  ) {
    const deleted = await this.customersService.bulkDelete(bulkDto.ids, organizationId);
    return { deleted, message: `Deleted ${deleted} customers` };
  }

  @Post('bulk/tags')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk add tags to customers' })
  @ApiResponse({ status: 200, description: 'Tags added to customers' })
  async bulkAddTags(
    @CurrentUser('organizationId') organizationId: string,
    @Body() body: { ids: string[]; tags: string[] },
  ) {
    const updated = await this.customersService.bulkAddTags(body.ids, organizationId, body.tags);
    return { updated, message: `Updated ${updated} customers` };
  }
}
