import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Client]), UserModule],
  providers: [ClientService],
  controllers: [ClientController],
  exports: [TypeOrmModule],
})
export class ClientModule {}
