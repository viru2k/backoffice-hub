import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { Permission } from './entities/permission.entity';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('permissions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Permissions('role:manage') // Only users who can manage roles should see permissions
  @ApiOperation({ summary: 'Retrieve all permissions' })
  @ApiResponse({ status: 200, description: 'List of all permissions.', type: [Permission] })
  async findAll(): Promise<Permission[]> {
    return this.permissionsService.findAll();
  }
}
