import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsultationToken, ConsultationTokenStatus } from './entities/consultation-token.entity';
import { Consultation } from './entities/consultation.entity';
import { CreateConsultationTokenDto } from './dto/consultation-token.dto';
import * as crypto from 'crypto';

@Injectable()
export class ConsultationTokenService {
  constructor(
    @InjectRepository(ConsultationToken)
    private consultationTokenRepository: Repository<ConsultationToken>,
    @InjectRepository(Consultation)
    private consultationRepository: Repository<Consultation>,
  ) {}

  async createTokenForConsultation(
    consultationId: number,
    createTokenDto: CreateConsultationTokenDto,
  ): Promise<ConsultationToken> {
    const consultation = await this.consultationRepository.findOne({
      where: { id: consultationId },
      relations: ['client', 'user', 'consultationType'],
    });

    if (!consultation) {
      throw new NotFoundException(`Consulta con ID ${consultationId} no encontrada`);
    }

    // Generar token único
    const token = this.generateSecureToken();

    // Calcular fecha de expiración por defecto (3 días)
    const defaultExpiresAt = new Date();
    defaultExpiresAt.setDate(defaultExpiresAt.getDate() + 3);

    const consultationToken = this.consultationTokenRepository.create({
      token,
      consultation,
      expiresAt: createTokenDto.expiresAt ? new Date(createTokenDto.expiresAt) : defaultExpiresAt,
      allowedActions: createTokenDto.allowedActions || ['view'],
      customMessage: createTokenDto.customMessage,
      status: ConsultationTokenStatus.ACTIVE,
    });

    return await this.consultationTokenRepository.save(consultationToken);
  }

  async createAutoTokensForConsultation(consultationId: number): Promise<ConsultationToken[]> {
    const consultation = await this.consultationRepository.findOne({
      where: { id: consultationId },
      relations: ['client', 'appointment'],
    });

    if (!consultation) {
      throw new NotFoundException(`Consulta con ID ${consultationId} no encontrada`);
    }

    const tokens: ConsultationToken[] = [];

    // Token post-consulta (3 días para ver resultados)
    if (consultation.status === 'completed') {
      const postConsultationToken = await this.createTokenForConsultation(consultationId, {
        allowedActions: ['view', 'download'],
        customMessage: `Resultados de su consulta del ${consultation.startTime?.toLocaleDateString()}`,
      });
      tokens.push(postConsultationToken);
    }

    // Token de seguimiento (7 días si requiere seguimiento)
    if (consultation.followUpRequired && consultation.followUpDate) {
      const followUpDate = new Date(consultation.followUpDate);
      followUpDate.setDate(followUpDate.getDate() + 7); // 7 días después del seguimiento

      const followUpToken = await this.createTokenForConsultation(consultationId, {
        allowedActions: ['view'],
        customMessage: 'Acceso para revisar su evolución y seguimiento',
        expiresAt: followUpDate,
      });
      tokens.push(followUpToken);
    }

    return tokens;
  }

  async validateAndUseToken(token: string): Promise<{ consultation: Consultation; tokenData: ConsultationToken }> {
    const consultationToken = await this.consultationTokenRepository.findOne({
      where: { token },
      relations: ['consultation', 'consultation.client', 'consultation.user', 'consultation.consultationType'],
    });

    if (!consultationToken) {
      throw new NotFoundException('Token no válido');
    }

    if (consultationToken.status !== ConsultationTokenStatus.ACTIVE) {
      throw new BadRequestException('Token ya ha sido utilizado o está inactivo');
    }

    if (consultationToken.isExpired) {
      // Marcar como expirado
      consultationToken.status = ConsultationTokenStatus.EXPIRED;
      await this.consultationTokenRepository.save(consultationToken);
      throw new BadRequestException('Token ha expirado');
    }

    // Marcar como usado
    consultationToken.status = ConsultationTokenStatus.USED;
    consultationToken.usedAt = new Date();
    await this.consultationTokenRepository.save(consultationToken);

    return {
      consultation: consultationToken.consultation,
      tokenData: consultationToken,
    };
  }

  async getConsultationByToken(token: string): Promise<{ consultation: Consultation; tokenData: ConsultationToken }> {
    const consultationToken = await this.consultationTokenRepository.findOne({
      where: { token },
      relations: ['consultation', 'consultation.client', 'consultation.user', 'consultation.consultationType'],
    });

    if (!consultationToken) {
      throw new NotFoundException('Token no válido');
    }

    if (!consultationToken.isValid) {
      throw new BadRequestException('Token no válido o expirado');
    }

    return {
      consultation: consultationToken.consultation,
      tokenData: consultationToken,
    };
  }

  async getTokensForConsultation(consultationId: number): Promise<ConsultationToken[]> {
    return await this.consultationTokenRepository.find({
      where: { consultation: { id: consultationId } },
      order: { createdAt: 'DESC' },
    });
  }

  async revokeToken(tokenId: number): Promise<void> {
    const token = await this.consultationTokenRepository.findOne({ where: { id: tokenId } });
    if (!token) {
      throw new NotFoundException('Token no encontrado');
    }

    token.status = ConsultationTokenStatus.EXPIRED;
    await this.consultationTokenRepository.save(token);
  }

  async cleanupExpiredTokens(): Promise<number> {
    const expiredTokens = await this.consultationTokenRepository.find({
      where: { status: ConsultationTokenStatus.ACTIVE },
    });

    let cleanedCount = 0;
    for (const token of expiredTokens) {
      if (token.isExpired) {
        token.status = ConsultationTokenStatus.EXPIRED;
        await this.consultationTokenRepository.save(token);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  private generateSecureToken(): string {
    // Generar token de 32 caracteres
    return crypto.randomBytes(32).toString('hex');
  }

  // Método para crear tokens específicos según el escenario
  async createTokenByScenario(
    consultationId: number,
    scenario: 'post-consultation' | 'follow-up' | 'pre-appointment' | 'custom',
    customData?: Partial<CreateConsultationTokenDto>,
  ): Promise<ConsultationToken> {
    const consultation = await this.consultationRepository.findOne({
      where: { id: consultationId },
      relations: ['appointment'],
    });

    if (!consultation) {
      throw new NotFoundException(`Consulta con ID ${consultationId} no encontrada`);
    }

    let tokenConfig: CreateConsultationTokenDto;

    switch (scenario) {
      case 'post-consultation':
        const postDate = new Date();
        postDate.setDate(postDate.getDate() + 3);
        tokenConfig = {
          allowedActions: ['view', 'download'],
          customMessage: 'Acceso a los resultados de su consulta',
          expiresAt: postDate,
        };
        break;

      case 'follow-up':
        const followDate = new Date();
        followDate.setDate(followDate.getDate() + 7);
        tokenConfig = {
          allowedActions: ['view'],
          customMessage: 'Seguimiento de su evolución',
          expiresAt: followDate,
        };
        break;

      case 'pre-appointment':
        const preDate = consultation.appointment?.startDateTime ? new Date(consultation.appointment.startDateTime) : new Date();
        preDate.setHours(preDate.getHours() + 24);
        tokenConfig = {
          allowedActions: ['view'],
          customMessage: 'Información de preparación para su cita',
          expiresAt: preDate,
        };
        break;

      case 'custom':
        tokenConfig = customData || {};
        break;

      default:
        throw new BadRequestException('Escenario de token no válido');
    }

    return await this.createTokenForConsultation(consultationId, tokenConfig);
  }
}