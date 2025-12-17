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

// Mapeo de nombres de restaurantes a imágenes y logos
// IMÁGENES: Deben ser de restaurantes (interiores, exteriores, ambientes), NO de platos - CADA UNA ÚNICA
// LOGOS: Logos SVG de comida de la red (de servicios confiables como Simple Icons, Heroicons, etc.)
const restaurantImages: Record<string, { image: string; logo: string }> = {
  'La Cocina Italiana': {
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop', // Restaurante italiano elegante
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/pizzaexpress.svg', // Logo SVG de pizza
  },
  'Sushi Master': {
    image: 'https://images.unsplash.com/photo-1552569973-610b8b3c8c8e?w=800&h=600&fit=crop', // Restaurante japonés moderno
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/sushiswap.svg', // Logo SVG de sushi
  },
  'Burger Paradise': {
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop', // Restaurante casual de hamburguesas
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/mcdonalds.svg', // Logo SVG de hamburguesa
  },
  'El Asador Argentino': {
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop', // Restaurante de parrilla argentina
    logo: 'https://raw.githubusercontent.com/tailwindlabs/heroicons/master/optimized/24/outline/fire.svg', // Logo SVG de fuego/parrilla
  },
  'Thai Garden': {
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop', // Restaurante tailandés
    logo: 'https://raw.githubusercontent.com/tailwindlabs/heroicons/master/optimized/24/outline/sparkles.svg', // Logo SVG de especias/curry
  },
  'Le Bistro Francais': {
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop', // Bistro francés elegante
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/wine.svg', // Logo SVG de vino
  },
  'Taco Loco': {
    image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop', // Restaurante mexicano vibrante
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tacobell.svg', // Logo SVG de taco
  },
  'Greek Taverna': {
    image: 'https://images.unsplash.com/photo-1606755962773-d324e7882b4e?w=800&h=600&fit=crop', // Taverna griega tradicional
    logo: 'https://raw.githubusercontent.com/tailwindlabs/heroicons/master/optimized/24/outline/sun.svg', // Logo SVG de sol/griego
  },
  'Indian Spice': {
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&h=600&fit=crop', // Restaurante indio auténtico
    logo: 'https://raw.githubusercontent.com/tailwindlabs/heroicons/master/optimized/24/outline/star.svg', // Logo SVG de estrella/especias
  },
  'Seoul BBQ': {
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', // Restaurante coreano de BBQ
    logo: 'https://raw.githubusercontent.com/tailwindlabs/heroicons/master/optimized/24/outline/fire.svg', // Logo SVG de fuego/BBQ
  },
};

async function updateRestaurantImages() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    const restaurantRepository = AppDataSource.getRepository(Restaurant);

    // Obtener todos los restaurantes usando query builder para evitar cargar columnas que no existen
    const restaurants = await restaurantRepository
      .createQueryBuilder('restaurant')
      .select(['restaurant.id', 'restaurant.name', 'restaurant.image'])
      .getMany();
    console.log(`📋 Encontrados ${restaurants.length} restaurantes`);

    // Verificar si la columna logo existe
    const hasLogoColumn = await AppDataSource.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='restaurants' AND column_name='logo'
    `).then((result: any[]) => result.length > 0);

    let updated = 0;
    for (const restaurant of restaurants) {
      if (restaurantImages[restaurant.name]) {
        const updateData: any = {
          image: restaurantImages[restaurant.name].image,
        };
        
        // Si la columna logo existe, actualizarla también
        if (hasLogoColumn) {
          updateData.logo = restaurantImages[restaurant.name].logo;
        }
        
        await restaurantRepository.update(restaurant.id, updateData);
        updated++;
        console.log(`   ✅ Actualizado: ${restaurant.name}${hasLogoColumn ? ' (con logo)' : ' (solo imagen)'}`);
      }
    }
    
    if (!hasLogoColumn) {
      console.log('\n💡 Nota: La columna "logo" no existe aún.');
      console.log('   Reinicia el servidor backend para que TypeORM la cree automáticamente.');
      console.log('   Luego ejecuta este script nuevamente para agregar los logos.');
    }

    console.log(`\n🎉 ¡Actualización completada!`);
    console.log(`✅ ${updated} restaurantes actualizados con imágenes y logos`);

  } catch (error) {
    console.error('❌ Error durante la actualización:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Conexión a la base de datos cerrada.');
    }
  }
}

updateRestaurantImages();
