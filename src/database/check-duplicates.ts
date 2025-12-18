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

async function checkDuplicates() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    const restaurantRepository = AppDataSource.getRepository(Restaurant);
    
    // Obtener todos los restaurantes
    const allRestaurants = await restaurantRepository.find({
      relations: ['owner'],
    });

    console.log(`\n📊 Total de restaurantes en la base de datos: ${allRestaurants.length}`);

    // Buscar duplicados por nombre
    const nameMap = new Map<string, Restaurant[]>();
    for (const restaurant of allRestaurants) {
      const name = restaurant.name.toLowerCase().trim();
      if (!nameMap.has(name)) {
        nameMap.set(name, []);
      }
      nameMap.get(name)!.push(restaurant);
    }

    // Encontrar duplicados
    const duplicates: Array<{ name: string; restaurants: Restaurant[] }> = [];
    for (const [name, restaurants] of nameMap.entries()) {
      if (restaurants.length > 1) {
        duplicates.push({ name, restaurants });
      }
    }

    if (duplicates.length === 0) {
      console.log('✅ No se encontraron restaurantes duplicados por nombre');
    } else {
      console.log(`\n⚠️  Se encontraron ${duplicates.length} nombres duplicados:\n`);
      
      for (const duplicate of duplicates) {
        console.log(`📌 "${duplicate.name}" (${duplicate.restaurants.length} restaurantes):`);
        for (const restaurant of duplicate.restaurants) {
          console.log(`   - ID: ${restaurant.id}`);
          console.log(`     Email: ${restaurant.email}`);
          console.log(`     Owner: ${restaurant.owner?.firstName} ${restaurant.owner?.lastName} (${restaurant.owner?.email})`);
          console.log(`     Creado: ${restaurant.createdAt}`);
          console.log('');
        }
      }
    }

    // Buscar duplicados por email
    const emailMap = new Map<string, Restaurant[]>();
    for (const restaurant of allRestaurants) {
      if (restaurant.email) {
        const email = restaurant.email.toLowerCase().trim();
        if (!emailMap.has(email)) {
          emailMap.set(email, []);
        }
        emailMap.get(email)!.push(restaurant);
      }
    }

    const emailDuplicates: Array<{ email: string; restaurants: Restaurant[] }> = [];
    for (const [email, restaurants] of emailMap.entries()) {
      if (restaurants.length > 1) {
        emailDuplicates.push({ email, restaurants });
      }
    }

    if (emailDuplicates.length === 0) {
      console.log('✅ No se encontraron restaurantes duplicados por email');
    } else {
      console.log(`\n⚠️  Se encontraron ${emailDuplicates.length} emails duplicados:\n`);
      
      for (const duplicate of emailDuplicates) {
        console.log(`📌 "${duplicate.email}" (${duplicate.restaurants.length} restaurantes):`);
        for (const restaurant of duplicate.restaurants) {
          console.log(`   - ID: ${restaurant.id}`);
          console.log(`     Nombre: ${restaurant.name}`);
          console.log(`     Owner: ${restaurant.owner?.firstName} ${restaurant.owner?.lastName}`);
          console.log('');
        }
      }
    }

    // Resumen
    console.log('\n📋 Resumen:');
    console.log(`   Total restaurantes: ${allRestaurants.length}`);
    console.log(`   Nombres únicos: ${nameMap.size}`);
    console.log(`   Emails únicos: ${emailMap.size}`);
    console.log(`   Duplicados por nombre: ${duplicates.length}`);
    console.log(`   Duplicados por email: ${emailDuplicates.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

checkDuplicates();
