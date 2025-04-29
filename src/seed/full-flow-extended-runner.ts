import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { FullFlowExtendedSeedService } from './full-flow-extended.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule); // Solo contexto, no servidor HTTP

  const seeder = app.get(FullFlowExtendedSeedService);

  try {
    console.log('🚀 Lanzando el Full Flow Extended Seeder...');
    await seeder.run(); // Llamamos el método run del seed service
    console.log('✅ Base de datos sembrada correctamente.');
  } catch (error) {
    console.error('❌ Error al sembrar la base de datos:', error);
  } finally {
    await app.close(); // Cierra la app Nest
    console.log('🛑 Conexión cerrada.');
  }
}

bootstrap();
