import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('test-upload')
@Controller('test-upload')
export class TestUploadController {

  @Post('debug')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Debug endpoint para probar entityId' })
  async testDebugUpload(
    @UploadedFile() file: Express.Multer.File,
    @Body() rawBody: any,
  ) {
    console.log('Raw body:', rawBody);
    console.log('Raw body entityId:', rawBody.entityId, 'type:', typeof rawBody.entityId);
    return {
      success: true,
      entityId: rawBody.entityId,
      entityIdType: typeof rawBody.entityId,
      parsed: rawBody.entityId ? parseInt(rawBody.entityId, 10) : null,
      isNaN: rawBody.entityId ? isNaN(parseInt(rawBody.entityId, 10)) : null
    };
  }
}