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

async function checkStaffUsers() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a la base de datos\n');

    const userRepository = AppDataSource.getRepository(User);
    const restaurantRepository = AppDataSource.getRepository(Restaurant);

    const staffEmails = [
      'admin.italiana@restaurant.com',
      'gerente.italiana@restaurant.com',
      'cajero.italiana@restaurant.com',
      'cocinero.italiana@restaurant.com',
      'mesero.italiana@restaurant.com',
    ];

    console.log('🔍 Verificando usuarios de staff...\n');

    for (const email of staffEmails) {
      console.log(`\n📧 Verificando: ${email}`);
      console.log('─'.repeat(50));
      
      const user = await userRepository.findOne({ 
        where: { email },
        relations: [] 
      });
      
      if (!user) {
        console.log('   ❌ Usuario NO encontrado en la base de datos');
        continue;
      }

      console.log('   ✅ Usuario encontrado');
      console.log(`   📝 ID: ${user.id}`);
      console.log(`   👤 Nombre: ${user.firstName} ${user.lastName}`);
      console.log(`   🔑 Role: ${user.role}`);
      console.log(`   👔 Staff Role: ${user.staffRole || 'NO DEFINIDO'}`);
      console.log(`   🏪 Restaurant ID: ${user.restaurantId || 'NO DEFINIDO'}`);
      console.log(`   ✅ Activo: ${user.isActive ? 'SÍ' : 'NO'}`);
      console.log(`   🔐 Password existe: ${user.password ? 'SÍ' : 'NO'}`);
      
      if (user.password) {
        console.log(`   🔐 Password length: ${user.password.length} caracteres`);
        console.log(`   🔐 Password starts with $2: ${user.password.startsWith('$2') ? 'SÍ (bcrypt válido)' : 'NO (formato inválido)'}`);
        
        // Probar con password123
        try {
          const testPassword = 'password123';
          const isValid = await bcrypt.compare(testPassword, user.password);
          console.log(`   🧪 Test con "password123": ${isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
          
          if (!isValid) {
            // Probar con otros passwords comunes
            const commonPasswords = ['password', '123456', 'admin', 'test'];
            for (const pwd of commonPasswords) {
              const test = await bcrypt.compare(pwd, user.password);
              if (test) {
                console.log(`   💡 Contraseña encontrada: "${pwd}"`);
                break;
              }
            }
          }
        } catch (error) {
          console.log(`   ❌ Error al verificar password: ${error.message}`);
        }
      } else {
        console.log('   ⚠️  Usuario NO tiene password, necesita ser configurado');
      }

      // Verificar restaurante asociado
      if (user.restaurantId) {
        const restaurant = await restaurantRepository.findOne({ 
          where: { id: user.restaurantId } 
        });
        if (restaurant) {
          console.log(`   🏪 Restaurante: ${restaurant.name}`);
        } else {
          console.log(`   ⚠️  Restaurant ID ${user.restaurantId} no existe`);
        }
      }
    }

    console.log('\n\n🔧 Creando/Actualizando usuarios con contraseña correcta...\n');
    
    const cocinaItaliana = await restaurantRepository.findOne({ 
      where: { name: 'La Cocina Italiana' } 
    });

    if (!cocinaItaliana) {
      console.log('❌ No se encontró el restaurante "La Cocina Italiana"');
      console.log('   Ejecuta primero: npm run seed');
    } else {
      const hashedPassword = await bcrypt.hash('password123', 10);
      console.log('   ✅ Hash de contraseña generado\n');

      const staffData = [
        { email: 'admin.italiana@restaurant.com', firstName: 'Giuseppe', lastName: 'Admin', staffRole: 'administrator' },
        { email: 'gerente.italiana@restaurant.com', firstName: 'Alessandro', lastName: 'Manager', staffRole: 'manager' },
        { email: 'cajero.italiana@restaurant.com', firstName: 'Maria', lastName: 'Cashier', staffRole: 'cashier' },
        { email: 'cocinero.italiana@restaurant.com', firstName: 'Marco', lastName: 'Cook', staffRole: 'cook' },
        { email: 'mesero.italiana@restaurant.com', firstName: 'Luca', lastName: 'Waiter', staffRole: 'waiter' },
      ];

      for (const data of staffData) {
        let user = await userRepository.findOne({ where: { email: data.email } });
        
        if (user) {
          console.log(`   🔄 Actualizando: ${data.email}`);
          user.password = hashedPassword;
          user.firstName = data.firstName;
          user.lastName = data.lastName;
          user.staffRole = data.staffRole;
          user.restaurantId = cocinaItaliana.id;
          user.role = 'client' as any;
          user.isActive = true;
        } else {
          console.log(`   ➕ Creando: ${data.email}`);
          user = userRepository.create({
            email: data.email,
            password: hashedPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            staffRole: data.staffRole,
            restaurantId: cocinaItaliana.id,
            role: 'client' as any,
            isActive: true,
          });
        }
        
        await userRepository.save(user);
        console.log(`   ✅ ${data.email} listo (${data.staffRole})`);
      }

      console.log('\n✅ Todos los usuarios han sido actualizados');
      console.log('\n📋 Credenciales:');
      console.log('   Contraseña: password123\n');
      staffData.forEach(data => {
        console.log(`   📧 ${data.email}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

checkStaffUsers();
