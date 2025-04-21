import { Controller, Post, Body, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateSubUserDto } from './dto/create-subuser.dto';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  @ApiOperation({ summary: 'Crear subusuario (perfil) asociado al usuario admin' })
  @UseGuards(AuthGuard('jwt'))
  @Post('create-sub')
  async createSubUser(@Request() req, @Body() dto: CreateSubUserDto) {
    const mainUser = req.user;
    if (!mainUser.isAdmin) {
      throw new ForbiddenException('Solo el usuario principal puede crear subusuarios');
    }

    return this.userService.createSubUser(mainUser.userId, dto);
  }
}
