import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DistributionService } from './distribution.service';
import { DistributionController } from './distribution.controller';
import { DistributionCampaign } from './entities/distribution-campaign.entity';
import { Survey } from '../surveys/entities/survey.entity';
import { Customer } from '../customers/entities/customer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DistributionCampaign, Survey, Customer])],
  controllers: [DistributionController],
  providers: [DistributionService],
  exports: [DistributionService],
})
export class DistributionModule {}
