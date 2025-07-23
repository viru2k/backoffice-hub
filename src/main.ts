import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv'; 

dotenv.config();

async function bootstrap() {
  // Las líneas de console.log para depurar pueden quedar o quitarse una vez funcione
  console.log('Después de dotenv.config() - DB_HOST:', process.env.DB_HOST);
  console.log('Después de dotenv.config() - DB_PORT:', process.env.DB_PORT);
  console.log('Después de dotenv.config() - DB_NAME:', process.env.DB_NAME);

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  const config = new DocumentBuilder()
    .setTitle('Backoffice Hub API')
    .setDescription('API del sistema SaaS modular de backoffice')
    .setVersion('1.2.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.enableCors({
    origin: 'http://localhost:4200', // The origin of your Angular app
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Allow cookies/authorization headers
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();