import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import * as bcrypt from 'bcrypt';
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

async function fixStaffPasswords() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    const userRepository = AppDataSource.getRepository(User);
    const restaurantRepository = AppDataSource.getRepository(Restaurant);

    // Buscar "La Cocina Italiana"
    const cocinaItaliana = await restaurantRepository.findOne({ 
      where: { name: 'La Cocina Italiana' } 
    });

    if (!cocinaItaliana) {
      console.log('❌ No se encontró el restaurante "La Cocina Italiana"');
      console.log('   Ejecuta primero: npm run seed');
      await AppDataSource.destroy();
      return;
    }

    const staffEmails = [
      'admin.italiana@restaurant.com',
      'gerente.italiana@restaurant.com',
      'cajero.italiana@restaurant.com',
      'cocinero.italiana@restaurant.com',
      'mesero.italiana@restaurant.com',
    ];

    const hashedPassword = await bcrypt.hash('password123', 10);

    console.log('\n🔧 Corrigiendo contraseñas de usuarios de staff...\n');

    for (const email of staffEmails) {
      const user = await userRepository.findOne({ where: { email } });
      
      if (user) {
        console.log(`   🔄 Actualizando contraseña para: ${email}`);
        user.password = hashedPassword;
        user.isActive = true;
        
        // Asegurar que tenga staffRole y restaurantId si no los tiene
        if (!user.staffRole) {
          if (email.includes('admin')) {
            user.staffRole = 'administrator';
          } else if (email.includes('gerente')) {
            user.staffRole = 'manager';
          } else if (email.includes('cajero')) {
            user.staffRole = 'cashier';
          } else if (email.includes('cocinero')) {
            user.staffRole = 'cook';
          } else if (email.includes('mesero')) {
            user.staffRole = 'waiter';
          }
        }
        
        if (!user.restaurantId) {
          user.restaurantId = cocinaItaliana.id;
        }
        
        await userRepository.save(user);
        console.log(`   ✅ Contraseña actualizada para: ${email}`);
      } else {
        console.log(`   ⚠️  Usuario no encontrado: ${email}`);
        console.log(`   💡 Creando usuario...`);
        
        let staffRole = 'waiter';
        if (email.includes('admin')) {
          staffRole = 'administrator';
        } else if (email.includes('gerente')) {
          staffRole = 'manager';
        } else if (email.includes('cajero')) {
          staffRole = 'cashier';
        } else if (email.includes('cocinero')) {
          staffRole = 'cook';
        }
        
        const newUser = userRepository.create({
          email,
          password: hashedPassword,
          firstName: email.split('.')[0].charAt(0).toUpperCase() + email.split('.')[0].slice(1),
          lastName: 'Staff',
          staffRole,
          restaurantId: cocinaItaliana.id,
          role: 'client' as any,
          isActive: true,
        });
        
        await userRepository.save(newUser);
        console.log(`   ✅ Usuario creado: ${email} (${staffRole})`);
      }
    }

    console.log('\n✅ Proceso completado');
    console.log('\n📋 Credenciales de acceso:');
    console.log('   Contraseña para todos: password123\n');
    staffEmails.forEach(email => {
      console.log(`   📧 ${email}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

fixStaffPasswords();
