import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ClientPortalSeedService } from './client-portal.seed';

async function runClientPortalSeed() {
  console.log('🌱 Iniciando seed de Portal de Clientes...\n');

  let app;
  try {
    app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log']
    });
    
    const seedService = app.get(ClientPortalSeedService);
    await seedService.seedClientPortalData();
    
    console.log('\n✅ Seed de Portal de Clientes ejecutado exitosamente!');
    console.log('\n📋 CREDENCIALES PARA PROBAR:');
    console.log('👤 juan.perez@email.com / cliente123');
    console.log('👤 maria.garcia@email.com / maria456');
    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('1. Iniciar backend: npm run start:dev');
    console.log('2. Probar endpoints en Swagger: http://localhost:3000/api/docs');
    console.log('3. Usar las credenciales mostradas arriba\n');
    
  } catch (error) {
    console.error('❌ Error ejecutando seed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
    }
    process.exit(0);
  }
}

runClientPortalSeed();