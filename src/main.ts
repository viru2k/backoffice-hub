import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
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
  //Launch app
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
