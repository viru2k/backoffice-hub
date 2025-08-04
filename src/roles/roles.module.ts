import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { Permission } from 'src/permissions/entities/permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission]),
  ],
  providers: [RolesService],
  controllers: [RolesController],
  exports: [RolesService, TypeOrmModule.forFeature([Role])], // Export RoleService if needed elsewhere
})
export class RolesModule {}
