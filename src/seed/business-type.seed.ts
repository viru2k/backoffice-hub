import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessType } from '../business-type/entities/business-type.entity';
import { ConsultationType } from '../business-type/entities/consultation-type.entity';

@Injectable()
export class BusinessTypeSeedService {
  constructor(
    @InjectRepository(BusinessType)
    private readonly businessTypeRepo: Repository<BusinessType>,
    @InjectRepository(ConsultationType)
    private readonly consultationTypeRepo: Repository<ConsultationType>,
  ) {}

  async seed() {
    console.log('🌱 Seeding business types...');

    // Verificar si ya existen datos
    const existingBusinessTypes = await this.businessTypeRepo.count();
    if (existingBusinessTypes > 0) {
      console.log('✅ Business types already exist, skipping seed');
      return;
    }

    // Crear tipos de negocio
    const businessTypesData = [
      {
        code: 'psychology',
        name: 'Psicología',
        description: 'Servicios de salud mental y terapia psicológica',
        iconName: 'psychology',
        colorScheme: '#4CAF50',
        defaultFields: {
          sessionDuration: 50,
          requiresHistory: true,
          allowsGroupSessions: true,
          fields: ['mentalState', 'mood', 'anxiety', 'depression', 'therapy_notes']
        }
      },
      {
        code: 'veterinary',
        name: 'Veterinaria',
        description: 'Atención médica veterinaria para mascotas',
        iconName: 'pets',
        colorScheme: '#2196F3',
        defaultFields: {
          sessionDuration: 30,
          requiresHistory: true,
          allowsGroupSessions: false,
          fields: ['species', 'breed', 'age', 'weight', 'vaccination_status', 'medical_history']
        }
      },
      {
        code: 'office',
        name: 'Atención de Oficina',
        description: 'Consultas y servicios administrativos de oficina',
        iconName: 'business',
        colorScheme: '#FF9800',
        defaultFields: {
          sessionDuration: 20,
          requiresHistory: false,
          allowsGroupSessions: true,
          fields: ['service_type', 'documents_required', 'urgency']
        }
      },
      {
        code: 'beauty',
        name: 'Centro de Belleza',
        description: 'Tratamientos estéticos y de belleza',
        iconName: 'spa',
        colorScheme: '#E91E63',
        defaultFields: {
          sessionDuration: 60,
          requiresHistory: false,
          allowsGroupSessions: false,
          fields: ['skin_type', 'allergies', 'previous_treatments', 'desired_outcome']
        }
      },
      {
        code: 'hair_salon',
        name: 'Peluquería',
        description: 'Servicios de peluquería y estilismo',
        iconName: 'content_cut',
        colorScheme: '#9C27B0',
        defaultFields: {
          sessionDuration: 45,
          requiresHistory: false,
          allowsGroupSessions: false,
          fields: ['hair_type', 'color_history', 'chemical_treatments', 'style_preference']
        }
      },
      {
        code: 'medical',
        name: 'Medicina General',
        description: 'Consultas médicas generales',
        iconName: 'local_hospital',
        colorScheme: '#F44336',
        defaultFields: {
          sessionDuration: 30,
          requiresHistory: true,
          allowsGroupSessions: false,
          fields: ['symptoms', 'medical_history', 'current_medications', 'vital_signs']
        }
      }
    ];

    const businessTypes: BusinessType[] = [];
    for (const data of businessTypesData) {
      const businessType = this.businessTypeRepo.create(data);
      const savedBusinessType = await this.businessTypeRepo.save(businessType);
      businessTypes.push(savedBusinessType);
    }

    console.log(`✅ Created ${businessTypes.length} business types`);

    // Crear tipos de consulta para cada tipo de negocio
    const consultationTypesData = [
      // Psicología
      {
        businessTypeId: businessTypes.find(bt => bt.code === 'psychology')?.id,
        name: 'Terapia Individual',
        description: 'Sesión de terapia psicológica individual',
        defaultDuration: 50,
        defaultPrice: 80.00,
        customFields: {
          therapy_type: 'string',
          session_goals: 'text',
          homework_assigned: 'text'
        },
        requiredFields: ['mood', 'therapy_notes']
      },
      {
        businessTypeId: businessTypes.find(bt => bt.code === 'psychology')?.id,
        name: 'Terapia de Pareja',
        description: 'Sesión de terapia para parejas',
        defaultDuration: 60,
        defaultPrice: 120.00,
        customFields: {
          relationship_duration: 'string',
          main_issues: 'text',
          both_present: 'boolean'
        },
        requiredFields: ['therapy_notes']
      },
      {
        businessTypeId: businessTypes.find(bt => bt.code === 'psychology')?.id,
        name: 'Evaluación Psicológica',
        description: 'Evaluación psicológica completa',
        defaultDuration: 90,
        defaultPrice: 150.00,
        customFields: {
          evaluation_type: 'string',
          tests_applied: 'array',
          report_required: 'boolean'
        },
        requiredFields: ['mentalState', 'therapy_notes']
      },
      
      // Veterinaria
      {
        businessTypeId: businessTypes.find(bt => bt.code === 'veterinary')?.id,
        name: 'Consulta General',
        description: 'Consulta veterinaria general',
        defaultDuration: 30,
        defaultPrice: 50.00,
        customFields: {
          pet_name: 'string',
          owner_concerns: 'text',
          examination_findings: 'text'
        },
        requiredFields: ['species', 'weight', 'medical_history']
      },
      {
        businessTypeId: businessTypes.find(bt => bt.code === 'veterinary')?.id,
        name: 'Vacunación',
        description: 'Aplicación de vacunas',
        defaultDuration: 15,
        defaultPrice: 35.00,
        customFields: {
          vaccines_applied: 'array',
          next_vaccination_date: 'date',
          reactions_observed: 'text'
        },
        requiredFields: ['species', 'vaccination_status']
      },
      {
        businessTypeId: businessTypes.find(bt => bt.code === 'veterinary')?.id,
        name: 'Cirugía Menor',
        description: 'Procedimientos quirúrgicos menores',
        defaultDuration: 60,
        defaultPrice: 200.00,
        customFields: {
          procedure_type: 'string',
          anesthesia_used: 'string',
          post_surgery_care: 'text'
        },
        requiredFields: ['species', 'weight', 'medical_history']
      },

      // Oficina
      {
        businessTypeId: businessTypes.find(bt => bt.code === 'office')?.id,
        name: 'Consulta Administrativa',
        description: 'Consulta para trámites administrativos',
        defaultDuration: 20,
        defaultPrice: 25.00,
        customFields: {
          procedure_requested: 'string',
          documents_provided: 'array',
          follow_up_required: 'boolean'
        },
        requiredFields: ['service_type']
      },
      {
        businessTypeId: businessTypes.find(bt => bt.code === 'office')?.id,
        name: 'Asesoría Legal',
        description: 'Consulta de asesoría legal',
        defaultDuration: 45,
        defaultPrice: 100.00,
        customFields: {
          legal_matter: 'string',
          case_complexity: 'string',
          legal_advice_given: 'text'
        },
        requiredFields: ['service_type', 'urgency']
      },

      // Belleza
      {
        businessTypeId: businessTypes.find(bt => bt.code === 'beauty')?.id,
        name: 'Facial',
        description: 'Tratamiento facial',
        defaultDuration: 60,
        defaultPrice: 75.00,
        customFields: {
          facial_type: 'string',
          products_used: 'array',
          skin_reaction: 'text'
        },
        requiredFields: ['skin_type', 'allergies']
      },
      {
        businessTypeId: businessTypes.find(bt => bt.code === 'beauty')?.id,
        name: 'Manicure',
        description: 'Tratamiento de uñas de manos',
        defaultDuration: 45,
        defaultPrice: 35.00,
        customFields: {
          nail_shape: 'string',
          polish_color: 'string',
          nail_art: 'boolean'
        },
        requiredFields: ['desired_outcome']
      },

      // Peluquería
      {
        businessTypeId: businessTypes.find(bt => bt.code === 'hair_salon')?.id,
        name: 'Corte de Cabello',
        description: 'Corte y peinado',
        defaultDuration: 45,
        defaultPrice: 40.00,
        customFields: {
          cut_style: 'string',
          length_removed: 'string',
          styling_preference: 'string'
        },
        requiredFields: ['hair_type', 'style_preference']
      },
      {
        businessTypeId: businessTypes.find(bt => bt.code === 'hair_salon')?.id,
        name: 'Coloración',
        description: 'Tinte y coloración del cabello',
        defaultDuration: 120,
        defaultPrice: 80.00,
        customFields: {
          color_formula: 'string',
          previous_color: 'string',
          processing_time: 'number'
        },
        requiredFields: ['hair_type', 'color_history']
      },

      // Medicina
      {
        businessTypeId: businessTypes.find(bt => bt.code === 'medical')?.id,
        name: 'Consulta General',
        description: 'Consulta médica general',
        defaultDuration: 30,
        defaultPrice: 60.00,
        customFields: {
          chief_complaint: 'string',
          physical_examination: 'text',
          laboratory_tests: 'array'
        },
        requiredFields: ['symptoms', 'vital_signs']
      }
    ];

    for (const data of consultationTypesData) {
      if (data.businessTypeId) {
        const consultationType = this.consultationTypeRepo.create(data);
        await this.consultationTypeRepo.save(consultationType);
      }
    }

    console.log(`✅ Created ${consultationTypesData.length} consultation types`);
    console.log('🌱 Business types seed completed!');
  }
}