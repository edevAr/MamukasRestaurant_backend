import { DataSource } from 'typeorm';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'restaurantes_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function activateRestaurants() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    const restaurantRepository = AppDataSource.getRepository(Restaurant);

    // Obtener todos los restaurantes
    const restaurants = await restaurantRepository.find();
    console.log(`📋 Encontrados ${restaurants.length} restaurantes`);

    // Activar todos los restaurantes
    let activated = 0;
    for (const restaurant of restaurants) {
      if (!restaurant.isActive) {
        restaurant.isActive = true;
        await restaurantRepository.save(restaurant);
        activated++;
        console.log(`   ✅ Activado: ${restaurant.name}`);
      } else {
        console.log(`   ℹ️  Ya activo: ${restaurant.name}`);
      }
    }

    console.log(`\n🎉 Proceso completado`);
    console.log(`✅ ${activated} restaurantes activados`);
    console.log(`ℹ️  ${restaurants.length - activated} restaurantes ya estaban activos`);

  } catch (error: any) {
    console.error('❌ Error durante la activación:', error.message);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

activateRestaurants();
