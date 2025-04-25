import {
    Controller,
    Get,
    Param,
    UseGuards,
  } from '@nestjs/common';
  import { SubscriptionService } from './subscription.service';
  import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
  import { AuthGuard } from '@nestjs/passport';
  import { SubscriptionResponseDto } from './dto/subscription-response.dto';
  
  @ApiTags('subscription')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Controller('subscription')
  export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) {}
  
    @Get()
    @ApiOperation({ summary: 'Listar tipos de suscripción disponibles' })
    @ApiResponse({ type: [SubscriptionResponseDto] })
    findAll() {
      return this.subscriptionService.findAll();
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Obtener detalles de una suscripción' })
    @ApiResponse({ type: SubscriptionResponseDto })
    findOne(@Param('id') id: number) {
      return this.subscriptionService.findOne(id);
    }
  }
  