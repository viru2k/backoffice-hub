import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function verifyClientData() {
  console.log('🔍 Verificando datos reales de clientes...');
  
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  
  // Check client data
  const clientData = await dataSource.query(`
    SELECT 
      id, 
      email, 
      name, 
      lastName,
      hasPortalAccess,
      password,
      lastLogin,
      preferredName,
      personalNotes,
      status
    FROM client 
    WHERE email = 'juan.perez@email.com'
  `);
  
  console.log('📊 Datos del cliente juan.perez@email.com:');
  console.log(JSON.stringify(clientData, null, 2));
  
  // Also check the second client
  const clientData2 = await dataSource.query(`
    SELECT 
      id, 
      email, 
      name, 
      lastName,
      hasPortalAccess,
      password,
      lastLogin,
      preferredName,
      personalNotes,
      status
    FROM client 
    WHERE email = 'maria.garcia@email.com'
  `);
  
  console.log('📊 Datos del cliente maria.garcia@email.com:');
  console.log(JSON.stringify(clientData2, null, 2));
  
  await app.close();
}

verifyClientData().catch(console.error);