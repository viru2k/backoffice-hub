import { Controller, Post, Body, Request, UseGuards, ForbiddenException, Get, Param, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateSubUserDto } from './dto/create-subuser.dto';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private userService: UserService,    @InjectRepository(User)
  private readonly userRepository: Repository<User>,) {}
  @ApiOperation({ summary: 'Crear subusuario (perfil) asociado al usuario admin' })
  @UseGuards(AuthGuard('jwt'))
  @Post('create-sub')
  @ApiResponse({ type: UserResponseDto })
  
  

  @Get('sub')
  @ApiOperation({ summary: 'Listar subusuarios propios' })
  @ApiResponse({ type: [UserResponseDto] })
  getSubUsers(@Request() req) {
    return this.userService.getSubUsers(req.user.id);
  }


  @Post(':ownerId/sub-users')
  @ApiOperation({ summary: 'Create a sub-user for a specific owner' })
  @ApiResponse({ status: 201, description: 'Sub-user created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async createSubUser(
    @Param('ownerId') ownerId: number,
    @Body() dto: CreateSubUserDto,
  ) {
    const owner = await this.userRepository.findOne({
      where: { id: ownerId },
      relations: ['subscriptions'],
    });

    if (!owner) {
      throw new BadRequestException('Owner not found.');
    }

    return this.userService.createSubUser(dto, owner);
  }
}
