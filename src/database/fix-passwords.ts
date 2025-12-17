import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
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

async function fixPasswords() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    const userRepository = AppDataSource.getRepository(User);
    
    // Obtener todos los usuarios propietarios con email @restaurant.com
    const owners = await userRepository.find({ 
      where: { role: Role.OWNER } 
    });

    const restaurantOwners = owners.filter(owner => 
      owner.email.includes('@restaurant.com')
    );

    if (restaurantOwners.length === 0) {
      console.log('⚠️  No se encontraron usuarios propietarios con email @restaurant.com');
      console.log('   Ejecuta el seed primero: npm run seed');
      return;
    }

    console.log(`\n🔧 Actualizando contraseñas de ${restaurantOwners.length} usuarios...`);
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    let updated = 0;

    for (const owner of restaurantOwners) {
      owner.password = hashedPassword;
      owner.isActive = true;
      await userRepository.save(owner);
      console.log(`   ✅ ${owner.email} - Contraseña actualizada a: password123`);
      updated++;
    }

    console.log(`\n🎉 ¡${updated} usuarios actualizados exitosamente!`);
    console.log(`✅ Todos los propietarios ahora tienen la contraseña: password123`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

fixPasswords();
