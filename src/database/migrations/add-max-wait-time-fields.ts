import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'restaurantes_db',
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function addMaxWaitTimeFields() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Agregar columna maxWaitTimeEnabled
      console.log('📝 Agregando columna maxWaitTimeEnabled...');
      await queryRunner.query(`
        ALTER TABLE restaurants 
        ADD COLUMN IF NOT EXISTS "maxWaitTimeEnabled" BOOLEAN DEFAULT true;
      `);

      // Agregar columna maxWaitTimeMinutes
      console.log('📝 Agregando columna maxWaitTimeMinutes...');
      await queryRunner.query(`
        ALTER TABLE restaurants 
        ADD COLUMN IF NOT EXISTS "maxWaitTimeMinutes" INTEGER DEFAULT 20;
      `);

      // Actualizar restaurantes existentes con valores por defecto si no tienen
      console.log('📝 Actualizando valores por defecto para restaurantes existentes...');
      await queryRunner.query(`
        UPDATE restaurants 
        SET "maxWaitTimeEnabled" = true 
        WHERE "maxWaitTimeEnabled" IS NULL;
      `);

      await queryRunner.query(`
        UPDATE restaurants 
        SET "maxWaitTimeMinutes" = 20 
        WHERE "maxWaitTimeMinutes" IS NULL;
      `);

      await queryRunner.commitTransaction();
      console.log('✅ Campos de tiempo máximo de espera agregados exitosamente');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

  } catch (error: any) {
    console.error('❌ Error durante la migración:', error.message);
    if (error.code === '42703') {
      console.log('⚠️  La columna ya existe, continuando...');
    } else {
      throw error;
    }
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

addMaxWaitTimeFields();
