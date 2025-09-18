import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

async function addPortalFieldsToDatabase() {
  console.log('🔧 Iniciando reparación de esquema de clientes...');
  
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  
  console.log('📊 Verificando esquema actual...');
  
  // Check if the new fields exist
  const result = await dataSource.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'backoffice_core'}' 
    AND TABLE_NAME = 'client' 
    AND COLUMN_NAME IN (
      'hasPortalAccess', 
      'password', 
      'lastLogin', 
      'passwordResetToken', 
      'passwordResetExpires',
      'preferredName',
      'personalNotes',
      'emailVerificationToken'
    )
  `);
  
  const existingColumns = result.map((row: any) => row.COLUMN_NAME);
  console.log('🔍 Columnas existentes:', existingColumns);
  
  // Add missing columns
  const columnsToAdd = [
    {
      name: 'hasPortalAccess',
      type: 'BOOLEAN',
      default: 'FALSE',
      comment: 'Si tiene acceso al portal de clientes'
    },
    {
      name: 'password',
      type: 'VARCHAR(255)',
      default: 'NULL',
      comment: 'Hash de contraseña para portal'
    },
    {
      name: 'lastLogin',
      type: 'DATETIME',
      default: 'NULL',
      comment: 'Último login al portal'
    },
    {
      name: 'passwordResetToken',
      type: 'VARCHAR(255)',
      default: 'NULL',
      comment: 'Token de reset de contraseña'
    },
    {
      name: 'passwordResetExpires',
      type: 'DATETIME',
      default: 'NULL',
      comment: 'Expiración del token'
    },
    {
      name: 'preferredName',
      type: 'VARCHAR(255)',
      default: 'NULL',
      comment: 'Nombre preferido por el cliente'
    },
    {
      name: 'personalNotes',
      type: 'TEXT',
      default: 'NULL',
      comment: 'Notas personales del cliente'
    },
    {
      name: 'emailVerificationToken',
      type: 'VARCHAR(255)',
      default: 'NULL',
      comment: 'Token de verificación de email'
    }
  ];
  
  for (const column of columnsToAdd) {
    if (!existingColumns.includes(column.name)) {
      console.log(`➕ Agregando columna: ${column.name}`);
      try {
        await dataSource.query(`
          ALTER TABLE client 
          ADD COLUMN ${column.name} ${column.type} ${column.default === 'NULL' ? 'DEFAULT NULL' : `DEFAULT ${column.default}`}
          COMMENT '${column.comment}'
        `);
        console.log(`✅ Columna ${column.name} agregada exitosamente`);
      } catch (error) {
        console.error(`❌ Error agregando columna ${column.name}:`, error.message);
      }
    } else {
      console.log(`✓ Columna ${column.name} ya existe`);
    }
  }
  
  // Now update the existing clients to have portal access
  console.log('🔧 Configurando acceso al portal para clientes existentes...');
  
  try {
    const clients = await dataSource.query(`
      SELECT id, email, name, lastName 
      FROM client 
      WHERE email IN (
        'juan.perez@email.com',
        'maria.garcia@email.com',
        'ana.lopez@email.com',
        'carlos.rodriguez@email.com',
        'sofia.martinez@email.com'
      )
    `);
    
    console.log('👥 Clientes encontrados:', clients.length);
    
    // Update portal access for specific clients
    for (const client of clients) {
      let password = 'cliente123';
      let preferredName = null;
      let personalNotes = null;
      
      // Set specific data based on client
      switch(client.email) {
        case 'juan.perez@email.com':
          preferredName = 'Juancho';
          personalNotes = 'Prefiero citas por la mañana. Soy alérgico a ciertos productos.';
          break;
        case 'maria.garcia@email.com':
          password = 'maria456';
          preferredName = 'Mari';
          personalNotes = 'Me gustan los tratamientos naturales. Disponible principalmente tardes.';
          break;
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await dataSource.query(`
        UPDATE client 
        SET 
          hasPortalAccess = TRUE,
          password = ?,
          preferredName = ?,
          personalNotes = ?
        WHERE id = ?
      `, [hashedPassword, preferredName, personalNotes, client.id]);
      
      console.log(`✅ Cliente ${client.email} configurado para portal`);
    }
    
  } catch (error) {
    console.error('❌ Error configurando clientes:', error.message);
  }
  
  console.log('✅ Reparación de esquema completada!');
  await app.close();
}

// Run the fix
addPortalFieldsToDatabase().catch(console.error);