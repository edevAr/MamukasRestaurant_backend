import { DataSource } from 'typeorm';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Menu } from '../menus/entities/menu.entity';
import { Promotion } from '../promotions/entities/promotion.entity';
import { MenuItemType } from '../menus/entities/menu.entity';
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

interface ComboData {
  name: string;
  description: string;
  price: number;
  items: string; // Descripción de los items incluidos
}

interface PromotionData {
  title: string;
  description: string;
  discount: number;
  startDate: string;
  endDate: string;
  isPromoted?: boolean;
}

const combosData: Record<string, ComboData[]> = {
  'La Cocina Italiana': [
    {
      name: 'Combo Italiano Clásico',
      description: 'Spaghetti Carbonara + Pizza Margherita + Vino Tinto + Tiramisú',
      price: 39.99,
      items: 'Pasta, Pizza, Vino y Postre',
    },
    {
      name: 'Combo Familiar',
      description: '2x Lasagna + 2x Pizza + 4x Coca Cola',
      price: 54.99,
      items: 'Ideal para 4 personas',
    },
  ],
  'Sushi Master': [
    {
      name: 'Combo Sushi Deluxe',
      description: 'Sushi Roll California + Sashimi de Salmón + Ramen + Sake Premium',
      price: 48.99,
      items: 'Sushi, Sashimi, Ramen y Sake',
    },
    {
      name: 'Combo Para Dos',
      description: '2x Sushi Roll + 2x Ramen + 2x Té Verde + Mochi',
      price: 42.99,
      items: 'Perfecto para compartir',
    },
  ],
  'Burger Paradise': [
    {
      name: 'Combo Burger Clásico',
      description: 'Burger Clásica + Papas Fritas + Refresco',
      price: 18.99,
      items: 'Hamburguesa, Papas y Bebida',
    },
    {
      name: 'Combo BBQ',
      description: 'Burger BBQ + Papas Fritas + Cerveza Artesanal + Brownie',
      price: 24.99,
      items: 'Hamburguesa BBQ, Papas, Cerveza y Postre',
    },
  ],
  'El Asador Argentino': [
    {
      name: 'Combo Parrilla',
      description: 'Bife de Chorizo + Empanadas (3) + Vino Malbec',
      price: 44.99,
      items: 'Carne, Empanadas y Vino',
    },
    {
      name: 'Combo Argentino Completo',
      description: 'Asado de Tira + Empanadas (6) + Vino + Flan',
      price: 58.99,
      items: 'Asado, Empanadas, Vino y Postre',
    },
  ],
  'Thai Garden': [
    {
      name: 'Combo Thai Especial',
      description: 'Pad Thai + Curry Verde + Té Tailandés',
      price: 38.99,
      items: 'Fideos, Curry y Bebida',
    },
    {
      name: 'Combo Completo Thai',
      description: 'Pad Thai + Tom Yum Soup + Té + Mango Sticky Rice',
      price: 45.99,
      items: 'Fideos, Sopa, Bebida y Postre',
    },
  ],
  'Le Bistro Francais': [
    {
      name: 'Combo Francés Clásico',
      description: 'Coq au Vin + Vino Bordeaux + Crème Brûlée',
      price: 58.99,
      items: 'Pollo, Vino y Postre',
    },
    {
      name: 'Combo Gourmet',
      description: 'Boeuf Bourguignon + Vino + Café au Lait + Crème Brûlée',
      price: 64.99,
      items: 'Carne, Vino, Café y Postre',
    },
  ],
  'Taco Loco': [
    {
      name: 'Combo Taco Loco',
      description: 'Tacos al Pastor (6) + Quesadillas (2) + Horchata',
      price: 22.99,
      items: '6 Tacos, 2 Quesadillas y Bebida',
    },
    {
      name: 'Combo Mexicano',
      description: 'Burrito Grande + Tacos (3) + Margarita + Flan',
      price: 28.99,
      items: 'Burrito, Tacos, Margarita y Postre',
    },
  ],
  'Greek Taverna': [
    {
      name: 'Combo Griego',
      description: 'Gyro de Pollo + Souvlaki (2) + Ouzo',
      price: 36.99,
      items: 'Gyro, Souvlaki y Licor',
    },
    {
      name: 'Combo Mediterráneo',
      description: 'Moussaka + Gyro + Ouzo + Baklava',
      price: 48.99,
      items: 'Moussaka, Gyro, Licor y Postre',
    },
  ],
  'Indian Spice': [
    {
      name: 'Combo Indio',
      description: 'Butter Chicken + Vegetable Biryani + Mango Lassi',
      price: 38.99,
      items: 'Pollo, Arroz y Bebida',
    },
    {
      name: 'Combo Curry',
      description: 'Lamb Curry + Biryani + Chai + Gulab Jamun',
      price: 44.99,
      items: 'Curry, Arroz, Té y Postre',
    },
  ],
  'Seoul BBQ': [
    {
      name: 'Combo Coreano',
      description: 'Bulgogi + Bibimbap + Soju',
      price: 49.99,
      items: 'Carne, Arroz y Licor',
    },
    {
      name: 'Combo BBQ Coreano',
      description: 'Bulgogi + Kimchi Jjigae + Soju + Bingsu',
      price: 56.99,
      items: 'Carne, Estofado, Licor y Postre',
    },
  ],
};

const promotionsData: Record<string, PromotionData[]> = {
  'La Cocina Italiana': [
    {
      title: '¡Martes de Pasta!',
      description: '20% de descuento en todos los platos de pasta todos los martes',
      discount: 20,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isPromoted: true,
    },
    {
      title: 'Combo Familiar Especial',
      description: 'Ahorra $10 en nuestro combo familiar los fines de semana',
      discount: 15,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  ],
  'Sushi Master': [
    {
      title: 'Happy Hour Sushi',
      description: '30% de descuento en todos los rolls de 3pm a 6pm',
      discount: 30,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isPromoted: true,
    },
    {
      title: 'Combo Deluxe Especial',
      description: 'Obtén un postre gratis con cualquier combo deluxe',
      discount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  ],
  'Burger Paradise': [
    {
      title: 'Burger Lunes',
      description: '2x1 en todas las hamburguesas los lunes',
      discount: 50,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isPromoted: true,
    },
    {
      title: 'Combo de Mediodía',
      description: '15% de descuento en combos de 12pm a 3pm',
      discount: 15,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  ],
  'El Asador Argentino': [
    {
      title: 'Noche de Parrilla',
      description: '25% de descuento en todos los cortes los viernes y sábados',
      discount: 25,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    {
      title: 'Vino Gratis',
      description: 'Botella de vino Malbec gratis con compras mayores a $50',
      discount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  ],
  'Thai Garden': [
    {
      title: 'Tailandés Auténtico',
      description: '20% de descuento en todos los curries',
      discount: 20,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    {
      title: 'Combo Thai Especial',
      description: 'Ahorra $8 en nuestro combo especial',
      discount: 18,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  ],
  'Le Bistro Francais': [
    {
      title: 'Cena Romántica',
      description: '30% de descuento en combos para dos los viernes',
      discount: 30,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isPromoted: true,
    },
    {
      title: 'Postre Gratis',
      description: 'Postre gratis con cualquier plato principal',
      discount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  ],
  'Taco Loco': [
    {
      title: 'Taco Tuesday',
      description: 'Tacos a mitad de precio todos los martes',
      discount: 50,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isPromoted: true,
    },
    {
      title: 'Combo Mexicano',
      description: '15% de descuento en todos los combos',
      discount: 15,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  ],
  'Greek Taverna': [
    {
      title: 'Sabor Mediterráneo',
      description: '20% de descuento en platos principales',
      discount: 20,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    {
      title: 'Combo Griego Especial',
      description: 'Ahorra $10 en nuestro combo griego',
      discount: 25,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  ],
  'Indian Spice': [
    {
      title: 'Curry Especial',
      description: '25% de descuento en todos los curries',
      discount: 25,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    {
      title: 'Combo Indio',
      description: 'Lleva un Chai gratis con cualquier combo',
      discount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  ],
  'Seoul BBQ': [
    {
      title: 'BBQ Coreano',
      description: '30% de descuento en todos los platos de BBQ',
      discount: 30,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isPromoted: true,
    },
    {
      title: 'Combo Coreano',
      description: 'Ahorra $12 en nuestro combo coreano',
      discount: 20,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  ],
};

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    const restaurantRepository = AppDataSource.getRepository(Restaurant);
    const menuRepository = AppDataSource.getRepository(Menu);
    const promotionRepository = AppDataSource.getRepository(Promotion);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Obtener todos los restaurantes
    const restaurants = await restaurantRepository.find();

    for (const restaurant of restaurants) {
      console.log(`\n📝 Procesando: ${restaurant.name}`);

      // Crear combos
      const combos = combosData[restaurant.name] || [];
      if (combos.length > 0) {
        for (const comboData of combos) {
          // Verificar si el combo ya existe
          const existingCombo = await menuRepository.findOne({
            where: {
              restaurantId: restaurant.id,
              name: comboData.name,
              type: MenuItemType.COMBO,
            },
          });

          if (!existingCombo) {
            const combo = menuRepository.create({
              name: comboData.name,
              description: comboData.description,
              price: comboData.price,
              type: MenuItemType.COMBO,
              available: true,
              quantity: 50,
              date: today,
              restaurantId: restaurant.id,
              isPromoted: true,
            });
            await menuRepository.save(combo);
            console.log(`   ✅ Combo creado: ${comboData.name}`);
          } else {
            console.log(`   ℹ️  Combo ya existe: ${comboData.name}`);
          }
        }
      }

      // Crear promociones
      const promotions = promotionsData[restaurant.name] || [];
      if (promotions.length > 0) {
        for (const promoData of promotions) {
          // Verificar si la promoción ya existe
          const existingPromo = await promotionRepository.findOne({
            where: {
              restaurantId: restaurant.id,
              title: promoData.title,
            },
          });

          if (!existingPromo) {
            const promotion = promotionRepository.create({
              title: promoData.title,
              description: promoData.description,
              discount: promoData.discount,
              startDate: new Date(promoData.startDate),
              endDate: new Date(promoData.endDate),
              isActive: true,
              isPromoted: promoData.isPromoted || false,
              restaurantId: restaurant.id,
            });
            await promotionRepository.save(promotion);
            console.log(`   ✅ Promoción creada: ${promoData.title}`);
          } else {
            console.log(`   ℹ️  Promoción ya existe: ${promoData.title}`);
          }
        }
      }
    }

    console.log('\n🎉 ¡Seed de combos y promociones completado exitosamente!');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

seed();

