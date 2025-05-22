import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';


async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.resolve(__dirname, '../.env.development') }); 
  } else {
    dotenv.config(); // Carga el .env por defecto (para Docker)
  }
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe()); 
  //swagger
  const config = new DocumentBuilder()
  .setTitle('Backoffice Hub API')
  .setDescription('API del sistema SaaS modular de backoffice')
  .setVersion('1.1.0')
  .addBearerAuth() // para usar Authorization: Bearer token
  .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.enableCors(); // si accedes desde frontend
  //Launch app
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
