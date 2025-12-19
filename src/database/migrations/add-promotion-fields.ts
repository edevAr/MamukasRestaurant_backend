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
  synchronize: false,
});

async function addPromotionFields() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // Agregar columnas de promoción a restaurants
    console.log('📝 Agregando columnas de promoción a la tabla restaurants...');
    
    await queryRunner.query(`
      ALTER TABLE "restaurants" 
      ADD COLUMN IF NOT EXISTS "promotionText" TEXT,
      ADD COLUMN IF NOT EXISTS "promotionImage" VARCHAR,
      ADD COLUMN IF NOT EXISTS "promotionStartDate" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "promotionEndDate" TIMESTAMP;
    `);

    console.log('✅ Columnas de promoción agregadas exitosamente');

    // Agregar columnas de respuesta a reviews
    console.log('📝 Agregando columnas de respuesta a la tabla reviews...');
    
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN IF NOT EXISTS "response" TEXT,
      ADD COLUMN IF NOT EXISTS "respondedBy" VARCHAR,
      ADD COLUMN IF NOT EXISTS "respondedAt" TIMESTAMP;
    `);

    console.log('✅ Columnas de respuesta agregadas exitosamente');

    await queryRunner.release();
    console.log('🎉 Migración completada exitosamente');

  } catch (error: any) {
    console.error('❌ Error durante la migración:', error.message);
    if (error.code === '42703') {
      console.log('⚠️  Algunas columnas ya existen, continuando...');
    } else {
      throw error;
    }
  } finally {
    await AppDataSource.destroy();
  }
}

addPromotionFields();
