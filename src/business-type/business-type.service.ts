import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessType } from './entities/business-type.entity';
import { ConsultationType } from './entities/consultation-type.entity';
import { CreateBusinessTypeDto, UpdateBusinessTypeDto } from './dto/create-business-type.dto';
import { CreateConsultationTypeDto, UpdateConsultationTypeDto } from './dto/create-consultation-type.dto';
import { BusinessTypeResponseDto } from './dto/business-type-response.dto';
import { ConsultationTypeResponseDto } from './dto/consultation-type-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class BusinessTypeService {
  constructor(
    @InjectRepository(BusinessType)
    private readonly businessTypeRepository: Repository<BusinessType>,
    @InjectRepository(ConsultationType)
    private readonly consultationTypeRepository: Repository<ConsultationType>,
  ) {}

  async createBusinessType(createDto: CreateBusinessTypeDto): Promise<BusinessTypeResponseDto> {
    const businessType = this.businessTypeRepository.create(createDto);
    const saved = await this.businessTypeRepository.save(businessType);
    return plainToInstance(BusinessTypeResponseDto, saved);
  }

  async findAllBusinessTypes(): Promise<BusinessTypeResponseDto[]> {
    const businessTypes = await this.businessTypeRepository.find({
      where: { isActive: true },
      relations: ['consultationTypes'],
      order: { name: 'ASC' }
    });
    return plainToInstance(BusinessTypeResponseDto, businessTypes);
  }

  async findBusinessTypeById(id: number): Promise<BusinessTypeResponseDto> {
    const businessType = await this.businessTypeRepository.findOne({
      where: { id, isActive: true },
      relations: ['consultationTypes']
    });
    
    if (!businessType) {
      throw new NotFoundException('Business type not found');
    }
    
    return plainToInstance(BusinessTypeResponseDto, businessType);
  }

  async findBusinessTypeByCode(code: string): Promise<BusinessTypeResponseDto> {
    const businessType = await this.businessTypeRepository.findOne({
      where: { code, isActive: true },
      relations: ['consultationTypes']
    });
    
    if (!businessType) {
      throw new NotFoundException('Business type not found');
    }
    
    return plainToInstance(BusinessTypeResponseDto, businessType);
  }

  async updateBusinessType(id: number, updateDto: UpdateBusinessTypeDto): Promise<BusinessTypeResponseDto> {
    const businessType = await this.businessTypeRepository.findOne({ where: { id } });
    
    if (!businessType) {
      throw new NotFoundException('Business type not found');
    }

    await this.businessTypeRepository.update(id, updateDto);
    const updated = await this.businessTypeRepository.findOne({
      where: { id },
      relations: ['consultationTypes']
    });
    
    return plainToInstance(BusinessTypeResponseDto, updated);
  }

  async deleteBusinessType(id: number): Promise<void> {
    const businessType = await this.businessTypeRepository.findOne({ where: { id } });
    
    if (!businessType) {
      throw new NotFoundException('Business type not found');
    }

    await this.businessTypeRepository.update(id, { isActive: false });
  }

  // CONSULTATION TYPES

  async createConsultationType(createDto: CreateConsultationTypeDto): Promise<ConsultationTypeResponseDto> {
    // Verificar que el business type existe
    const businessType = await this.businessTypeRepository.findOne({
      where: { id: createDto.businessTypeId, isActive: true }
    });
    
    if (!businessType) {
      throw new NotFoundException('Business type not found');
    }

    const consultationType = this.consultationTypeRepository.create(createDto);
    const saved = await this.consultationTypeRepository.save(consultationType);
    return plainToInstance(ConsultationTypeResponseDto, saved);
  }

  async findConsultationTypesByBusinessType(businessTypeId: number): Promise<ConsultationTypeResponseDto[]> {
    const consultationTypes = await this.consultationTypeRepository.find({
      where: { businessTypeId, isActive: true },
      relations: ['businessType'],
      order: { name: 'ASC' }
    });
    return plainToInstance(ConsultationTypeResponseDto, consultationTypes);
  }

  async findConsultationTypeById(id: number): Promise<ConsultationTypeResponseDto> {
    const consultationType = await this.consultationTypeRepository.findOne({
      where: { id, isActive: true },
      relations: ['businessType']
    });
    
    if (!consultationType) {
      throw new NotFoundException('Consultation type not found');
    }
    
    return plainToInstance(ConsultationTypeResponseDto, consultationType);
  }

  async updateConsultationType(id: number, updateDto: UpdateConsultationTypeDto): Promise<ConsultationTypeResponseDto> {
    const consultationType = await this.consultationTypeRepository.findOne({ where: { id } });
    
    if (!consultationType) {
      throw new NotFoundException('Consultation type not found');
    }

    await this.consultationTypeRepository.update(id, updateDto);
    const updated = await this.consultationTypeRepository.findOne({
      where: { id },
      relations: ['businessType']
    });
    
    return plainToInstance(ConsultationTypeResponseDto, updated);
  }

  async deleteConsultationType(id: number): Promise<void> {
    const consultationType = await this.consultationTypeRepository.findOne({ where: { id } });
    
    if (!consultationType) {
      throw new NotFoundException('Consultation type not found');
    }

    await this.consultationTypeRepository.update(id, { isActive: false });
  }

  // TEMPLATES Y CAMPOS DINÁMICOS

  async getConsultationTemplate(businessTypeCode: string): Promise<any> {
    const businessType = await this.findBusinessTypeByCode(businessTypeCode);
    
    // Templates específicos según el tipo de negocio
    const templates = {
      veterinary: {
        title: 'Consulta Veterinaria',
        sections: [
          {
            name: 'Información del Paciente',
            fields: [
              { name: 'petName', label: 'Nombre de la mascota', type: 'text', required: true },
              { name: 'species', label: 'Especie', type: 'select', options: ['Perro', 'Gato', 'Ave', 'Reptil', 'Otro'], required: true },
              { name: 'breed', label: 'Raza', type: 'text', required: false },
              { name: 'age', label: 'Edad', type: 'number', required: true },
              { name: 'weight', label: 'Peso (kg)', type: 'number', step: 0.1, required: true },
              { name: 'sex', label: 'Sexo', type: 'select', options: ['Macho', 'Hembra'], required: true },
              { name: 'neutered', label: '¿Esterilizado?', type: 'boolean', required: false }
            ]
          },
          {
            name: 'Motivo de Consulta',
            fields: [
              { name: 'symptoms', label: 'Síntomas observados', type: 'textarea', required: true },
              { name: 'duration', label: 'Duración de los síntomas', type: 'text', required: false },
              { name: 'appetite', label: 'Apetito', type: 'select', options: ['Normal', 'Aumentado', 'Disminuido', 'Ausente'], required: false },
              { name: 'activity', label: 'Actividad', type: 'select', options: ['Normal', 'Aumentada', 'Disminuida'], required: false }
            ]
          },
          {
            name: 'Examen Clínico',
            fields: [
              { name: 'temperature', label: 'Temperatura (°C)', type: 'number', step: 0.1, required: false },
              { name: 'heartRate', label: 'Frecuencia cardíaca', type: 'number', required: false },
              { name: 'respiratoryRate', label: 'Frecuencia respiratoria', type: 'number', required: false },
              { name: 'diagnosis', label: 'Diagnóstico', type: 'textarea', required: false },
              { name: 'treatment', label: 'Tratamiento', type: 'textarea', required: false },
              { name: 'recommendations', label: 'Recomendaciones', type: 'textarea', required: false }
            ]
          }
        ]
      },
      psychology: {
        title: 'Consulta Psicológica',
        sections: [
          {
            name: 'Información del Paciente',
            fields: [
              { name: 'age', label: 'Edad', type: 'number', required: true },
              { name: 'occupation', label: 'Ocupación', type: 'text', required: false },
              { name: 'maritalStatus', label: 'Estado civil', type: 'select', options: ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a'], required: false },
              { name: 'emergencyContact', label: 'Contacto de emergencia', type: 'text', required: false }
            ]
          },
          {
            name: 'Motivo de Consulta',
            fields: [
              { name: 'primaryConcern', label: 'Motivo principal de consulta', type: 'textarea', required: true },
              { name: 'symptoms', label: 'Síntomas actuales', type: 'textarea', required: true },
              { name: 'duration', label: 'Duración de los síntomas', type: 'text', required: false },
              { name: 'previousTreatment', label: 'Tratamientos previos', type: 'textarea', required: false }
            ]
          },
          {
            name: 'Evaluación Clínica',
            fields: [
              { name: 'mentalStatus', label: 'Estado mental', type: 'textarea', required: false },
              { name: 'mood', label: 'Estado de ánimo', type: 'select', options: ['Eutímico', 'Deprimido', 'Ansioso', 'Irritable', 'Eufórico'], required: false },
              { name: 'diagnosis', label: 'Impresión diagnóstica', type: 'textarea', required: false },
              { name: 'treatment', label: 'Plan de tratamiento', type: 'textarea', required: false },
              { name: 'recommendations', label: 'Recomendaciones', type: 'textarea', required: false }
            ]
          }
        ]
      },
      beauty: {
        title: 'Consulta de Belleza',
        sections: [
          {
            name: 'Información del Cliente',
            fields: [
              { name: 'age', label: 'Edad', type: 'number', required: true },
              { name: 'skinType', label: 'Tipo de piel', type: 'select', options: ['Grasa', 'Seca', 'Mixta', 'Sensible', 'Normal'], required: true },
              { name: 'allergies', label: 'Alergias conocidas', type: 'textarea', required: false },
              { name: 'currentProducts', label: 'Productos actuales', type: 'textarea', required: false }
            ]
          },
          {
            name: 'Tratamiento Solicitado',
            fields: [
              { name: 'desiredTreatment', label: 'Tratamiento deseado', type: 'textarea', required: true },
              { name: 'skinConcerns', label: 'Preocupaciones de la piel', type: 'textarea', required: true },
              { name: 'previousTreatments', label: 'Tratamientos previos', type: 'textarea', required: false },
              { name: 'expectations', label: 'Expectativas', type: 'textarea', required: false }
            ]
          },
          {
            name: 'Plan de Tratamiento',
            fields: [
              { name: 'recommendedTreatment', label: 'Tratamiento recomendado', type: 'textarea', required: false },
              { name: 'productRecommendations', label: 'Productos recomendados', type: 'textarea', required: false },
              { name: 'frequency', label: 'Frecuencia recomendada', type: 'text', required: false },
              { name: 'followUp', label: 'Seguimiento', type: 'textarea', required: false }
            ]
          }
        ]
      },
      hair_salon: {
        title: 'Consulta de Peluquería',
        sections: [
          {
            name: 'Información del Cliente',
            fields: [
              { name: 'hairType', label: 'Tipo de cabello', type: 'select', options: ['Liso', 'Ondulado', 'Rizado', 'Muy rizado'], required: true },
              { name: 'hairTexture', label: 'Textura', type: 'select', options: ['Fino', 'Medio', 'Grueso'], required: true },
              { name: 'scalpCondition', label: 'Condición del cuero cabelludo', type: 'select', options: ['Normal', 'Graso', 'Seco', 'Sensible'], required: false },
              { name: 'chemicalTreatments', label: 'Tratamientos químicos previos', type: 'textarea', required: false }
            ]
          },
          {
            name: 'Servicio Solicitado',
            fields: [
              { name: 'desiredService', label: 'Servicio deseado', type: 'textarea', required: true },
              { name: 'currentLength', label: 'Largo actual', type: 'text', required: false },
              { name: 'desiredLength', label: 'Largo deseado', type: 'text', required: false },
              { name: 'colorHistory', label: 'Historial de color', type: 'textarea', required: false },
              { name: 'inspiration', label: 'Referencias o inspiración', type: 'textarea', required: false }
            ]
          },
          {
            name: 'Plan de Servicio',
            fields: [
              { name: 'recommendedService', label: 'Servicio recomendado', type: 'textarea', required: false },
              { name: 'techniques', label: 'Técnicas a utilizar', type: 'textarea', required: false },
              { name: 'products', label: 'Productos a utilizar', type: 'textarea', required: false },
              { name: 'maintenance', label: 'Mantenimiento recomendado', type: 'textarea', required: false },
              { name: 'nextAppointment', label: 'Próxima cita sugerida', type: 'text', required: false }
            ]
          }
        ]
      },
      medical: {
        title: 'Consulta Médica',
        sections: [
          {
            name: 'Información del Paciente',
            fields: [
              { name: 'age', label: 'Edad', type: 'number', required: true },
              { name: 'weight', label: 'Peso (kg)', type: 'number', step: 0.1, required: false },
              { name: 'height', label: 'Altura (cm)', type: 'number', required: false },
              { name: 'bloodType', label: 'Tipo de sangre', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], required: false },
              { name: 'allergies', label: 'Alergias', type: 'textarea', required: false },
              { name: 'currentMedications', label: 'Medicamentos actuales', type: 'textarea', required: false }
            ]
          },
          {
            name: 'Motivo de Consulta',
            fields: [
              { name: 'chiefComplaint', label: 'Motivo principal', type: 'textarea', required: true },
              { name: 'symptoms', label: 'Síntomas', type: 'textarea', required: true },
              { name: 'duration', label: 'Duración', type: 'text', required: false },
              { name: 'severity', label: 'Severidad', type: 'select', options: ['Leve', 'Moderado', 'Severo'], required: false },
              { name: 'associatedSymptoms', label: 'Síntomas asociados', type: 'textarea', required: false }
            ]
          },
          {
            name: 'Examen Físico',
            fields: [
              { name: 'vitalSigns', label: 'Signos vitales', type: 'textarea', required: false },
              { name: 'bloodPressure', label: 'Presión arterial', type: 'text', required: false },
              { name: 'heartRate', label: 'Frecuencia cardíaca', type: 'number', required: false },
              { name: 'temperature', label: 'Temperatura (°C)', type: 'number', step: 0.1, required: false },
              { name: 'physicalExam', label: 'Examen físico', type: 'textarea', required: false },
              { name: 'diagnosis', label: 'Diagnóstico', type: 'textarea', required: false },
              { name: 'treatment', label: 'Tratamiento', type: 'textarea', required: false },
              { name: 'prescriptions', label: 'Prescripciones', type: 'textarea', required: false },
              { name: 'recommendations', label: 'Recomendaciones', type: 'textarea', required: false }
            ]
          }
        ]
      }
    };

    return templates[businessTypeCode] || {
      title: 'Consulta General',
      sections: [
        {
          name: 'Información General',
          fields: [
            { name: 'symptoms', label: 'Síntomas/Motivo de consulta', type: 'textarea', required: true },
            { name: 'notes', label: 'Notas adicionales', type: 'textarea', required: false }
          ]
        }
      ]
    };
  }
}