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
} from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { CreateRewardProgramDto } from './dto/create-reward-program.dto';
import { UpdateRewardProgramDto } from './dto/update-reward-program.dto';
import { RewardProgramResponseDto } from './dto/reward-program-response.dto';
import { CustomerRewardResponseDto } from './dto/customer-reward-response.dto';
import { RewardsMetricsDto } from './dto/rewards-metrics.dto';
import { plainToInstance } from 'class-transformer';

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  // Gestión de Programas de Recompensas
  @Post('programs')
  @HttpCode(HttpStatus.CREATED)
  async createRewardProgram(@Body() createRewardProgramDto: CreateRewardProgramDto): Promise<RewardProgramResponseDto> {
    const rewardProgram = await this.rewardsService.createRewardProgram(createRewardProgramDto);
    return plainToInstance(RewardProgramResponseDto, rewardProgram, { excludeExtraneousValues: true });
  }

  @Get('programs')
  async getAllRewardPrograms(): Promise<RewardProgramResponseDto[]> {
    const programs = await this.rewardsService.getAllRewardPrograms();
    return plainToInstance(RewardProgramResponseDto, programs, { excludeExtraneousValues: true });
  }

  @Get('programs/active')
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
  async getClientRewards(@Param('clientId', ParseIntPipe) clientId: number): Promise<CustomerRewardResponseDto[]> {
    const rewards = await this.rewardsService.getClientRewards(clientId);
    return plainToInstance(CustomerRewardResponseDto, rewards, { excludeExtraneousValues: true });
  }

  @Get('customer/:clientId/active')
  async getClientActiveRewards(@Param('clientId', ParseIntPipe) clientId: number): Promise<CustomerRewardResponseDto[]> {
    const rewards = await this.rewardsService.getClientActiveRewards(clientId);
    return plainToInstance(CustomerRewardResponseDto, rewards, { excludeExtraneousValues: true });
  }

  @Get('customer/:clientId/earned')
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
  async getRewardsMetrics(): Promise<RewardsMetricsDto> {
    const metrics = await this.rewardsService.getRewardsMetrics();
    return plainToInstance(RewardsMetricsDto, metrics, { excludeExtraneousValues: true });
  }

  // Endpoints para integración con otros módulos
  @Post('trigger/appointment-completed/:clientId')
  @HttpCode(HttpStatus.OK)
  async triggerAppointmentCompleted(@Param('clientId', ParseIntPipe) clientId: number): Promise<{ message: string }> {
    await this.rewardsService.onAppointmentCompleted(clientId);
    return { message: 'Progreso de recompensas actualizado por cita completada' };
  }

  @Post('trigger/consultation-completed/:clientId')
  @HttpCode(HttpStatus.OK)
  async triggerConsultationCompleted(@Param('clientId', ParseIntPipe) clientId: number): Promise<{ message: string }> {
    await this.rewardsService.onConsultationCompleted(clientId);
    return { message: 'Progreso de recompensas actualizado por consulta completada' };
  }

  @Post('trigger/service-completed/:clientId')
  @HttpCode(HttpStatus.OK)
  async triggerServiceCompleted(@Param('clientId', ParseIntPipe) clientId: number): Promise<{ message: string }> {
    await this.rewardsService.onServiceCompleted(clientId);
    return { message: 'Progreso de recompensas actualizado por servicio completado' };
  }

  @Post('trigger/purchase-completed/:clientId')
  @HttpCode(HttpStatus.OK)
  async triggerPurchaseCompleted(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Body('amount', ParseIntPipe) amount: number,
  ): Promise<{ message: string }> {
    await this.rewardsService.onPurchaseCompleted(clientId, amount);
    return { message: 'Progreso de recompensas actualizado por compra completada' };
  }

  // Mantenimiento
  @Post('cleanup/expired')
  @HttpCode(HttpStatus.OK)
  async cleanupExpiredRewards(): Promise<{ message: string }> {
    await this.rewardsService.cleanupExpiredRewards();
    return { message: 'Recompensas expiradas limpiadas correctamente' };
  }
}