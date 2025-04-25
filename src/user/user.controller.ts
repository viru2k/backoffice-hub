import { Controller, Post, Body, Request, UseGuards, ForbiddenException, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateSubUserDto } from './dto/create-subuser.dto';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  @ApiOperation({ summary: 'Crear subusuario (perfil) asociado al usuario admin' })
  @UseGuards(AuthGuard('jwt'))
  @Post('create-sub')
  @ApiResponse({ type: UserResponseDto })
  async createSubUser(@Request() req, @Body() dto: CreateSubUserDto) {
    const mainUser = req.user;
    if (!mainUser.isAdmin) {
      throw new ForbiddenException('Solo el usuario principal puede crear subusuarios');
    }

    return this.userService.createSubUser(mainUser.userId, dto);
  }

  @Get('sub')
  @ApiOperation({ summary: 'Listar subusuarios propios' })
  @ApiResponse({ type: [UserResponseDto] })
  getSubUsers(@Request() req) {
    return this.userService.getSubUsers(req.user.id);
  }
}
