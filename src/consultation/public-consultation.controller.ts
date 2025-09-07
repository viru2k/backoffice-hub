import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConsultationTokenService } from './consultation-token.service';
import { PublicConsultationDto, ConsultationTokenResponseDto } from './dto/consultation-token.dto';
import { plainToInstance } from 'class-transformer';

@Controller('public/consultations')
export class PublicConsultationController {
  constructor(private readonly consultationTokenService: ConsultationTokenService) {}

  @Get('access/:token')
  async accessConsultationByToken(@Param('token') token: string): Promise<PublicConsultationDto> {
    if (!token || token.length < 10) {
      throw new BadRequestException('Token inválido');
    }

    try {
      const { consultation, tokenData } = await this.consultationTokenService.getConsultationByToken(token);

      // Preparar datos públicos (sin información sensible)
      const publicData = {
        id: consultation.id,
        consultationNumber: consultation.consultationNumber,
        status: consultation.status,
        startTime: consultation.startTime,
        endTime: consultation.endTime,
        diagnosis: consultation.diagnosis,
        treatment: consultation.treatment,
        recommendations: consultation.recommendations,
        nextAppointment: consultation.nextAppointment,
        followUpRequired: consultation.followUpRequired,
        followUpDate: consultation.followUpDate,
        customMessage: tokenData.customMessage,
        clientName: consultation.client?.fullname || 'Paciente',
        doctorName: consultation.user?.name || 'Doctor',
        consultationType: consultation.consultationType?.name || 'Consulta general',
      };

      return plainToInstance(PublicConsultationDto, publicData, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al acceder a la consulta');
    }
  }

  @Post('access/:token/use')
  @HttpCode(HttpStatus.OK)
  async useTokenAndAccessConsultation(@Param('token') token: string): Promise<{
    consultation: PublicConsultationDto;
    message: string;
  }> {
    if (!token || token.length < 10) {
      throw new BadRequestException('Token inválido');
    }

    try {
      const { consultation, tokenData } = await this.consultationTokenService.validateAndUseToken(token);

      const publicData = {
        id: consultation.id,
        consultationNumber: consultation.consultationNumber,
        status: consultation.status,
        startTime: consultation.startTime,
        endTime: consultation.endTime,
        diagnosis: consultation.diagnosis,
        treatment: consultation.treatment,
        recommendations: consultation.recommendations,
        nextAppointment: consultation.nextAppointment,
        followUpRequired: consultation.followUpRequired,
        followUpDate: consultation.followUpDate,
        customMessage: tokenData.customMessage,
        clientName: consultation.client?.fullname || 'Paciente',
        doctorName: consultation.user?.name || 'Doctor',
        consultationType: consultation.consultationType?.name || 'Consulta general',
      };

      return {
        consultation: plainToInstance(PublicConsultationDto, publicData, { excludeExtraneousValues: true }),
        message: tokenData.customMessage || 'Acceso concedido a la información de su consulta',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al procesar el token');
    }
  }

  @Get('validate/:token')
  async validateToken(@Param('token') token: string): Promise<{
    valid: boolean;
    message: string;
    allowedActions?: string[];
    expiresAt?: Date;
  }> {
    if (!token || token.length < 10) {
      return {
        valid: false,
        message: 'Token inválido',
      };
    }

    try {
      const { tokenData } = await this.consultationTokenService.getConsultationByToken(token);

      return {
        valid: true,
        message: 'Token válido',
        allowedActions: tokenData.allowedActions,
        expiresAt: tokenData.expiresAt,
      };
    } catch (error) {
      return {
        valid: false,
        message: error.message || 'Token no válido',
      };
    }
  }

  @Get('info/:token')
  async getTokenInfo(@Param('token') token: string): Promise<{
    customMessage: string;
    allowedActions: string[];
    expiresAt: Date;
    consultationType: string;
  }> {
    if (!token || token.length < 10) {
      throw new BadRequestException('Token inválido');
    }

    try {
      const { consultation, tokenData } = await this.consultationTokenService.getConsultationByToken(token);

      return {
        customMessage: tokenData.customMessage || 'Información de su consulta disponible',
        allowedActions: tokenData.allowedActions,
        expiresAt: tokenData.expiresAt,
        consultationType: consultation.consultationType?.name || 'Consulta general',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al obtener información del token');
    }
  }
}