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

async function addStaffRoleFields() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Agregar columna staffRole si no existe
      await queryRunner.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS "staffRole" VARCHAR(255) NULL;
      `);

      // Agregar columna restaurantId si no existe
      await queryRunner.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS "restaurantId" VARCHAR(255) NULL;
      `);

      await queryRunner.commitTransaction();
      console.log('✅ Campos staffRole y restaurantId agregados exitosamente');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

addStaffRoleFields();
