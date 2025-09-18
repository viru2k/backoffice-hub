import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EmailTemplatesSeedService } from './email-templates.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const seeder = app.get(EmailTemplatesSeedService);

  try {
    console.log('🚀 Lanzando el Email Templates Seeder...');
    await seeder.seed();
    console.log('✅ Templates de email creados correctamente.');
  } catch (error) {
    console.error('❌ Error al crear templates de email:', error);
  } finally {
    await app.close();
    console.log('🛑 Conexión cerrada.');
  }
}

bootstrap();