import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { SubscriptionPlanFeature } from './entities/subscription-plan-feature.entity';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { CreateSubscriptionPlanFeatureDto } from './dto/create-subscription-plan-feature.dto';
import { SubscriptionPlanResponseDto, SubscriptionPlanFeatureResponseDto } from './dto/subscription-plan-response.dto';

@Injectable()
export class SubscriptionPlanService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionPlanRepository: Repository<SubscriptionPlan>,

    @InjectRepository(SubscriptionPlanFeature)
    private readonly subscriptionPlanFeatureRepository: Repository<SubscriptionPlanFeature>,
  ) {}

  async create(createDto: CreateSubscriptionPlanDto): Promise<SubscriptionPlanResponseDto> {
    const plan = this.subscriptionPlanRepository.create(createDto);
    const saved = await this.subscriptionPlanRepository.save(plan);
    return this.toResponseDto(saved);
  }

  async findAll(): Promise<SubscriptionPlanResponseDto[]> {
    const plans = await this.subscriptionPlanRepository.find({ relations: ['features'] });
    return plans.map(plan => this.toResponseDto(plan));
  }

  async findOne(id: number): Promise<SubscriptionPlanResponseDto> {
    const plan = await this.subscriptionPlanRepository.findOne({
      where: { id },
      relations: ['features'],
    });

    if (!plan) {
      throw new NotFoundException('Subscription Plan not found');
    }

    return this.toResponseDto(plan);
  }

  async addFeature(planId: number, featureDto: CreateSubscriptionPlanFeatureDto): Promise<SubscriptionPlanFeatureResponseDto> {
    const plan = await this.subscriptionPlanRepository.findOneBy({ id: planId });

    if (!plan) {
      throw new NotFoundException('Subscription Plan not found');
    }

    const feature = this.subscriptionPlanFeatureRepository.create({
      ...featureDto,
      subscriptionPlan: plan,
    });

    const savedFeature = await this.subscriptionPlanFeatureRepository.save(feature);

    return {
      feature: savedFeature.feature,
      enabled: savedFeature.enabled,
    };
  }

  private toResponseDto(plan: SubscriptionPlan): SubscriptionPlanResponseDto {
    return {
      id: plan.id,
      name: plan.name,
      priceMonthly: +plan.priceMonthly,
      priceSemiannual: +plan.priceSemiannual,
      priceAnnual: +plan.priceAnnual,
      maxUsers: plan.maxUsers,
      description: plan.description,
      features: plan.features?.map(f => ({
        feature: f.feature,
        enabled: f.enabled,
      })) || [],
    };
  }
}
