import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadController } from './upload.controller';
import { TestUploadController } from './test-upload.controller';
import { UploadService } from './upload.service';
import { FileUpload } from './entities/file-upload.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileUpload]),
    MulterModule.register({
      // Configuración para usar memoria en lugar de disco temporalmente
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [UploadController, TestUploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}