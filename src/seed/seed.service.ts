import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from '../subscription-plan/entities/subscription-plan.entity';
import { SubscriptionPlanFeature } from '../subscription-plan/entities/subscription-plan-feature.entity';
import { EmailTemplatesSeedService } from './email-templates.seed';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(SubscriptionPlanFeature)
    private readonly featureRepository: Repository<SubscriptionPlanFeature>,
    private readonly emailTemplatesSeedService: EmailTemplatesSeedService,
  ) {}

  async seedSubscriptionPlans() {
    console.log('🌱 Seeding Subscription Plans...');

    const existing = await this.planRepository.find();
    if (existing.length > 0) {
      console.log('✅ Plans already exist. Skipping seed.');
      return;
    }

    const plans = [
      {
        name: 'Starter',
        priceMonthly: 9.99,
        priceSemiannual: 49.99,
        priceAnnual: 89.99,
        maxUsers: 5,
        description: 'Ideal for small teams',
        features: [
          { feature: 'agenda', enabled: true },
          { feature: 'clients', enabled: true },
          { feature: 'products', enabled: false },
          { feature: 'stock', enabled: false },
        ],
      },
      {
        name: 'Professional',
        priceMonthly: 19.99,
        priceSemiannual: 99.99,
        priceAnnual: 179.99,
        maxUsers: 15,
        description: 'For growing businesses',
        features: [
          { feature: 'agenda', enabled: true },
          { feature: 'clients', enabled: true },
          { feature: 'products', enabled: true },
          { feature: 'stock', enabled: true },
        ],
      },
      {
        name: 'Enterprise',
        priceMonthly: 49.99,
        priceSemiannual: 249.99,
        priceAnnual: 449.99,
        maxUsers: 100,
        description: 'For large companies',
        features: [
          { feature: 'agenda', enabled: true },
          { feature: 'clients', enabled: true },
          { feature: 'products', enabled: true },
          { feature: 'stock', enabled: true },
          { feature: 'notifications', enabled: true },
        ],
      },
    ];

    for (const planData of plans) {
      const plan = this.planRepository.create({
        name: planData.name,
        priceMonthly: planData.priceMonthly,
        priceSemiannual: planData.priceSemiannual,
        priceAnnual: planData.priceAnnual,
        maxUsers: planData.maxUsers,
        description: planData.description,
      });
      const savedPlan = await this.planRepository.save(plan);

      for (const feature of planData.features) {
        const featureEntity = this.featureRepository.create({
          feature: feature.feature,
          enabled: feature.enabled,
          subscriptionPlan: savedPlan,
        });
        await this.featureRepository.save(featureEntity);
      }
    }

    console.log('✅ Subscription Plans seeded successfully!');
  }

  async seedEmailTemplates() {
    console.log('🌱 Seeding Email Templates...');
    await this.emailTemplatesSeedService.seed();
    console.log('✅ Email Templates seeded successfully!');
  }


  async seedAll() {
    console.log('🌱 Starting comprehensive seeding...');
    await this.seedSubscriptionPlans();
    await this.seedEmailTemplates();
    console.log('🎉 All seeding completed!');
  }
}
