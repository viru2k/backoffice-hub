import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { CreateRewardProgramDto } from './dto/create-reward-program.dto';
import { UpdateRewardProgramDto } from './dto/update-reward-program.dto';
import { RewardProgramResponseDto } from './dto/reward-program-response.dto';
import { CustomerRewardResponseDto } from './dto/customer-reward-response.dto';
import { RewardsMetricsDto } from './dto/rewards-metrics.dto';
import { OperationResultDto, TriggerOperationResultDto, PurchaseOperationResultDto } from './dto/operation-result.dto';
import { plainToInstance } from 'class-transformer';
import { ClientResponseDto } from '../client/dto/client-response.dto';

@Controller('rewards')
@ApiTags('Rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  // Gestión de Programas de Recompensas
  @Post('programs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nuevo programa de recompensas' })
  @ApiResponse({ status: 201, type: RewardProgramResponseDto })
  async createRewardProgram(@Body() createRewardProgramDto: CreateRewardProgramDto): Promise<RewardProgramResponseDto> {
    const rewardProgram = await this.rewardsService.createRewardProgram(createRewardProgramDto);
    return plainToInstance(RewardProgramResponseDto, rewardProgram, { excludeExtraneousValues: true });
  }

  @Get('programs')
  @ApiOperation({ summary: 'Obtener todos los programas de recompensas' })
  @ApiResponse({ status: 200, type: [RewardProgramResponseDto] })
  async getAllRewardPrograms(): Promise<RewardProgramResponseDto[]> {
    const programs = await this.rewardsService.getAllRewardPrograms();
    return plainToInstance(RewardProgramResponseDto, programs, { excludeExtraneousValues: true });
  }

  @Get('programs/active')
  @ApiOperation({ summary: 'Obtener programas de recompensas activos' })
  @ApiResponse({ status: 200, type: [RewardProgramResponseDto] })
  async getActiveRewardPrograms(): Promise<RewardProgramResponseDto[]> {
    const programs = await this.rewardsService.getActiveRewardPrograms();
    return plainToInstance(RewardProgramResponseDto, programs, { excludeExtraneousValues: true });
  }

  @Get('programs/business-type/:businessTypeId')
  async getRewardProgramsByBusinessType(
    @Param('businessTypeId', ParseIntPipe) businessTypeId: number,
  ): Promise<RewardProgramResponseDto[]> {
    const programs = await this.rewardsService.getRewardProgramsByBusinessType(businessTypeId);
    return plainToInstance(RewardProgramResponseDto, programs, { excludeExtraneousValues: true });
  }

  @Get('programs/:id')
  async getRewardProgramById(@Param('id', ParseIntPipe) id: number): Promise<RewardProgramResponseDto> {
    const programs = await this.rewardsService.getAllRewardPrograms();
    const program = programs.find(p => p.id === id);
    if (!program) {
      throw new Error(`Programa de recompensas con ID ${id} no encontrado`);
    }
    return plainToInstance(RewardProgramResponseDto, program, { excludeExtraneousValues: true });
  }

  @Patch('programs/:id')
  async updateRewardProgram(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRewardProgramDto: UpdateRewardProgramDto,
  ): Promise<RewardProgramResponseDto> {
    const rewardProgram = await this.rewardsService.updateRewardProgram(id, updateRewardProgramDto);
    return plainToInstance(RewardProgramResponseDto, rewardProgram, { excludeExtraneousValues: true });
  }

  @Delete('programs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRewardProgram(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.rewardsService.deleteRewardProgram(id);
  }

  // Gestión de Recompensas de Cliente
  @Get('customer/:clientId')
  @ApiOperation({ summary: 'Obtener todas las recompensas de un cliente' })
  @ApiResponse({ status: 200, type: [CustomerRewardResponseDto] })
  async getClientRewards(@Param('clientId', ParseIntPipe) clientId: number): Promise<CustomerRewardResponseDto[]> {
    const rewards = await this.rewardsService.getClientRewards(clientId);
    return plainToInstance(CustomerRewardResponseDto, rewards, { excludeExtraneousValues: true });
  }

  @Get('customer/:clientId/active')
  @ApiOperation({ summary: 'Obtener recompensas activas (en progreso) de un cliente' })
  @ApiResponse({ status: 200, type: [CustomerRewardResponseDto] })
  async getClientActiveRewards(@Param('clientId', ParseIntPipe) clientId: number): Promise<CustomerRewardResponseDto[]> {
    const rewards = await this.rewardsService.getClientActiveRewards(clientId);
    return plainToInstance(CustomerRewardResponseDto, rewards, { excludeExtraneousValues: true });
  }

  @Get('customer/:clientId/earned')
  @ApiOperation({ summary: 'Obtener recompensas ganadas de un cliente' })
  @ApiResponse({ status: 200, type: [CustomerRewardResponseDto] })
  async getClientEarnedRewards(@Param('clientId', ParseIntPipe) clientId: number): Promise<CustomerRewardResponseDto[]> {
    const rewards = await this.rewardsService.getClientEarnedRewards(clientId);
    return plainToInstance(CustomerRewardResponseDto, rewards, { excludeExtraneousValues: true });
  }

  @Get('customer/:clientId/history')
  async getClientRewardHistory(@Param('clientId', ParseIntPipe) clientId: number): Promise<CustomerRewardResponseDto[]> {
    const rewards = await this.rewardsService.getClientRewards(clientId);
    return plainToInstance(CustomerRewardResponseDto, rewards, { excludeExtraneousValues: true });
  }

  @Post('customer/:clientId/redeem/:rewardId')
  @HttpCode(HttpStatus.OK)
  async redeemReward(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Param('rewardId', ParseIntPipe) rewardId: number,
  ): Promise<CustomerRewardResponseDto> {
    const reward = await this.rewardsService.redeemReward(clientId, rewardId);
    return plainToInstance(CustomerRewardResponseDto, reward, { excludeExtraneousValues: true });
  }

  // Métricas y Analytics
  @Get('metrics')
  @ApiOperation({ summary: 'Obtener métricas del sistema de recompensas' })
  @ApiResponse({ status: 200, type: RewardsMetricsDto })
  async getRewardsMetrics(): Promise<RewardsMetricsDto> {
    const metrics = await this.rewardsService.getRewardsMetrics();
    return plainToInstance(RewardsMetricsDto, metrics, { excludeExtraneousValues: true });
  }

  // Búsqueda de Clientes para Recompensas
  @Get('client-search')
  @ApiOperation({ summary: 'Buscar clientes para el sistema de recompensas' })
  @ApiResponse({ status: 200, type: [ClientResponseDto] })
  async searchClientsForRewards(@Query('query') query: string): Promise<ClientResponseDto[]> {
    const clients = await this.rewardsService.searchClientsForRewards(query);
    return plainToInstance(ClientResponseDto, clients, { excludeExtraneousValues: true });
  }

  // Endpoints para integración con otros módulos
  @Post('trigger/appointment-completed/:clientId')
  @HttpCode(HttpStatus.OK)
  async triggerAppointmentCompleted(@Param('clientId', ParseIntPipe) clientId: number): Promise<TriggerOperationResultDto> {
    await this.rewardsService.onAppointmentCompleted(clientId);
    return new TriggerOperationResultDto('Progreso de recompensas actualizado por cita completada', clientId, 'appointment');
  }

  @Post('trigger/consultation-completed/:clientId')
  @HttpCode(HttpStatus.OK)
  async triggerConsultationCompleted(@Param('clientId', ParseIntPipe) clientId: number): Promise<TriggerOperationResultDto> {
    await this.rewardsService.onConsultationCompleted(clientId);
    return new TriggerOperationResultDto('Progreso de recompensas actualizado por consulta completada', clientId, 'consultation');
  }

  @Post('trigger/service-completed/:clientId')
  @HttpCode(HttpStatus.OK)
  async triggerServiceCompleted(@Param('clientId', ParseIntPipe) clientId: number): Promise<TriggerOperationResultDto> {
    await this.rewardsService.onServiceCompleted(clientId);
    return new TriggerOperationResultDto('Progreso de recompensas actualizado por servicio completado', clientId, 'service');
  }

  @Post('trigger/purchase-completed/:clientId')
  @HttpCode(HttpStatus.OK)
  async triggerPurchaseCompleted(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Body('amount', ParseIntPipe) amount: number,
  ): Promise<PurchaseOperationResultDto> {
    await this.rewardsService.onPurchaseCompleted(clientId, amount);
    return new PurchaseOperationResultDto('Progreso de recompensas actualizado por compra completada', clientId, amount);
  }

  // Mantenimiento
  @Post('cleanup/expired')
  @HttpCode(HttpStatus.OK)
  async cleanupExpiredRewards(): Promise<OperationResultDto> {
    await this.rewardsService.cleanupExpiredRewards();
    return new OperationResultDto('Recompensas expiradas limpiadas correctamente');
  }
}