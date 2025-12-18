import { DataSource } from 'typeorm';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Menu } from '../menus/entities/menu.entity';
import { Review } from '../reviews/entities/review.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { MenuReservation } from '../menu-reservations/entities/menu-reservation.entity';
import { Promotion } from '../promotions/entities/promotion.entity';
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

async function removeDuplicates() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    const restaurantRepository = AppDataSource.getRepository(Restaurant);
    const menuRepository = AppDataSource.getRepository(Menu);
    const reviewRepository = AppDataSource.getRepository(Review);
    const orderRepository = AppDataSource.getRepository(Order);
    const orderItemRepository = AppDataSource.getRepository(OrderItem);
    const reservationRepository = AppDataSource.getRepository(Reservation);
    const menuReservationRepository = AppDataSource.getRepository(MenuReservation);
    const promotionRepository = AppDataSource.getRepository(Promotion);
    
    // Obtener todos los restaurantes
    const allRestaurants = await restaurantRepository.find({
      relations: ['owner'],
      order: { createdAt: 'ASC' },
    });

    console.log(`\n📊 Total de restaurantes: ${allRestaurants.length}`);

    // Agrupar por nombre (case-insensitive)
    const nameMap = new Map<string, Restaurant[]>();
    for (const restaurant of allRestaurants) {
      const name = restaurant.name.toLowerCase().trim();
      if (!nameMap.has(name)) {
        nameMap.set(name, []);
      }
      nameMap.get(name)!.push(restaurant);
    }

    let removedCount = 0;

    // Para cada grupo de duplicados, mantener el más antiguo y eliminar los demás
    for (const [name, restaurants] of nameMap.entries()) {
      if (restaurants.length > 1) {
        console.log(`\n🔍 Procesando duplicados de "${name}":`);
        
        // Ordenar por fecha de creación (el más antiguo primero)
        restaurants.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        // Mantener el primero (más antiguo)
        const keepRestaurant = restaurants[0];
        const toRemove = restaurants.slice(1);

        console.log(`   ✅ Manteniendo: ${keepRestaurant.id} (creado: ${keepRestaurant.createdAt})`);

        // Eliminar los duplicados
        for (const duplicate of toRemove) {
          console.log(`   🗑️  Eliminando: ${duplicate.id} (creado: ${duplicate.createdAt})`);
          
          try {
            // Eliminar todas las relaciones primero (en orden correcto)
            // 1. Obtener todos los menús del restaurante
            const menusToDelete = await menuRepository.find({ where: { restaurantId: duplicate.id } });
            
            // 2. Eliminar Menu Reservations primero (dependen de Menu)
            for (const menu of menusToDelete) {
              await menuReservationRepository.delete({ menuId: menu.id });
            }
            // También eliminar por restaurantId por si acaso
            await menuReservationRepository.delete({ restaurantId: duplicate.id });
            
            // 3. OrderItems (dependen de Menu)
            for (const menu of menusToDelete) {
              await orderItemRepository.delete({ menuId: menu.id });
            }
            
            // 4. Menús (ahora que no hay referencias)
            await menuRepository.delete({ restaurantId: duplicate.id });
            
            // 5. Promotions
            await promotionRepository.delete({ restaurantId: duplicate.id });
            
            // 6. Reviews
            await reviewRepository.delete({ restaurantId: duplicate.id });
            
            // 7. Reservations
            await reservationRepository.delete({ restaurantId: duplicate.id });
            
            // 8. Orders (y sus items ya eliminados arriba)
            await orderRepository.delete({ restaurantId: duplicate.id });
            
            // 9. Finalmente, eliminar el restaurante
            await restaurantRepository.delete(duplicate.id);
            removedCount++;
            console.log(`      ✅ Eliminado exitosamente`);
          } catch (error: any) {
            console.log(`      ⚠️  Error al eliminar: ${error.message}`);
            // Continuar con el siguiente
          }
        }
      }
    }

    // Verificar duplicados por email también
    const emailMap = new Map<string, Restaurant[]>();
    const remainingRestaurants = await restaurantRepository.find({
      relations: ['owner'],
      order: { createdAt: 'ASC' },
    });

    for (const restaurant of remainingRestaurants) {
      if (restaurant.email) {
        const email = restaurant.email.toLowerCase().trim();
        if (!emailMap.has(email)) {
          emailMap.set(email, []);
        }
        emailMap.get(email)!.push(restaurant);
      }
    }

    for (const [email, restaurants] of emailMap.entries()) {
      if (restaurants.length > 1) {
        console.log(`\n🔍 Procesando duplicados por email "${email}":`);
        
        restaurants.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        const keepRestaurant = restaurants[0];
        const toRemove = restaurants.slice(1);

        console.log(`   ✅ Manteniendo: ${keepRestaurant.id} - ${keepRestaurant.name}`);

        for (const duplicate of toRemove) {
          console.log(`   🗑️  Eliminando: ${duplicate.id} - ${duplicate.name}`);
          
          try {
            // Eliminar todas las relaciones primero (en orden correcto)
            const menusToDelete = await menuRepository.find({ where: { restaurantId: duplicate.id } });
            
            // Eliminar Menu Reservations primero (dependen de Menu)
            for (const menu of menusToDelete) {
              await menuReservationRepository.delete({ menuId: menu.id });
            }
            await menuReservationRepository.delete({ restaurantId: duplicate.id });
            
            // OrderItems (dependen de Menu)
            for (const menu of menusToDelete) {
              await orderItemRepository.delete({ menuId: menu.id });
            }
            
            // Menús
            await menuRepository.delete({ restaurantId: duplicate.id });
            
            // Promotions
            await promotionRepository.delete({ restaurantId: duplicate.id });
            
            // Reviews
            await reviewRepository.delete({ restaurantId: duplicate.id });
            
            // Reservations
            await reservationRepository.delete({ restaurantId: duplicate.id });
            
            // Orders
            await orderRepository.delete({ restaurantId: duplicate.id });
            
            // Finalmente, eliminar el restaurante
            await restaurantRepository.delete(duplicate.id);
            removedCount++;
            console.log(`      ✅ Eliminado exitosamente`);
          } catch (error: any) {
            console.log(`      ⚠️  Error al eliminar: ${error.message}`);
          }
        }
      }
    }

    console.log(`\n🎉 Proceso completado!`);
    console.log(`   ✅ Restaurantes eliminados: ${removedCount}`);
    
    const finalCount = await restaurantRepository.count();
    console.log(`   ✅ Restaurantes restantes: ${finalCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

removeDuplicates();
