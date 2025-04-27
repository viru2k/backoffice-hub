import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { SubscriptionPlanService } from './subscription-plan.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { CreateSubscriptionPlanFeatureDto } from './dto/create-subscription-plan-feature.dto';
import { SubscriptionPlanResponseDto, SubscriptionPlanFeatureResponseDto } from './dto/subscription-plan-response.dto';

@ApiTags('Subscription Plan')
@Controller('subscription-plan')
export class SubscriptionPlanController {
  constructor(private readonly subscriptionPlanService: SubscriptionPlanService) {}

  @Post()
  @ApiResponse({ status: 201, type: SubscriptionPlanResponseDto })
  create(@Body() createDto: CreateSubscriptionPlanDto) {
    return this.subscriptionPlanService.create(createDto);
  }

  @Get()
  @ApiResponse({ status: 200, type: [SubscriptionPlanResponseDto] })
  findAll() {
    return this.subscriptionPlanService.findAll();
  }

  @Get(':id')
  @ApiResponse({ status: 200, type: SubscriptionPlanResponseDto })
  findOne(@Param('id') id: string) {
    return this.subscriptionPlanService.findOne(+id);
  }

  @Post(':id/feature')
  @ApiResponse({ status: 201, type: SubscriptionPlanFeatureResponseDto })
  addFeature(@Param('id') id: string, @Body() createFeatureDto: CreateSubscriptionPlanFeatureDto) {
    return this.subscriptionPlanService.addFeature(+id, createFeatureDto);
  }
}
