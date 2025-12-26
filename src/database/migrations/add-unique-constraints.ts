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

async function addUniqueConstraints() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Agregar constraint único para name (case-insensitive)
      console.log('📝 Agregando constraint único para name...');
      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "UQ_restaurants_name_lower" 
        ON restaurants (LOWER(TRIM(name)));
      `);

      // Agregar constraint único para email (case-insensitive, solo si no es null)
      console.log('📝 Agregando constraint único para email...');
      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "UQ_restaurants_email_lower" 
        ON restaurants (LOWER(TRIM(email)))
        WHERE email IS NOT NULL;
      `);

      await queryRunner.commitTransaction();
      console.log('✅ Constraints únicos agregados exitosamente');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

  } catch (error: any) {
    console.error('❌ Error durante la migración:', error.message);
    if (error.code === '42P07') {
      console.log('⚠️  El índice ya existe, continuando...');
    } else {
      throw error;
    }
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

addUniqueConstraints();
