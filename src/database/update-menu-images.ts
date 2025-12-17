import { DataSource } from 'typeorm';
import { Menu } from '../menus/entities/menu.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
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

// Mapeo de nombres de platos a imágenes
const menuImages: Record<string, string> = {
  // La Cocina Italiana
  'Spaghetti Carbonara': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop',
  'Pizza Margherita': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=600&fit=crop',
  'Lasagna Tradicional': 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&h=600&fit=crop',
  'Tiramisú': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop',
  'Vino Tinto': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop',
  'Coca Cola': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&h=600&fit=crop',
  
  // Sushi Master
  'Sushi Roll California': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop',
  'Sashimi de Salmón': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop',
  'Ramen Tonkotsu': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop',
  'Mochi de Fresa': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop',
  'Sake Premium': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop',
  'Té Verde': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop',
  
  // Burger Paradise
  'Burger Clásica': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
  'Burger BBQ': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=600&fit=crop',
  'Papas Fritas': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=600&fit=crop',
  'Brownie con Helado': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&h=600&fit=crop',
  'Cerveza Artesanal': 'https://images.unsplash.com/photo-1535958637004-0327e845cfee?w=800&h=600&fit=crop',
  'Refresco': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&h=600&fit=crop',
  
  // El Asador Argentino
  'Bife de Chorizo': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop',
  'Asado de Tira': 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=800&h=600&fit=crop',
  'Empanadas (3 unidades)': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&h=600&fit=crop',
  'Flan Casero': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop',
  'Vino Malbec': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop',
  'Agua Mineral': 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop',
  
  // Thai Garden
  'Pad Thai': 'https://images.unsplash.com/photo-1559314809-0d155014c29e?w=800&h=600&fit=crop',
  'Curry Verde': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&h=600&fit=crop',
  'Tom Yum Soup': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop',
  'Mango Sticky Rice': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop',
  'Thai Iced Tea': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop',
  'Agua de Coco': 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop',
  
  // Le Bistro Francais
  'Coq au Vin': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop',
  'Boeuf Bourguignon': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop',
  'Ratatouille': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop',
  'Crème Brûlée': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop',
  'Vino Bordeaux': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop',
  'Café au Lait': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=600&fit=crop',
  
  // Taco Loco
  'Tacos al Pastor (3 unidades)': 'https://images.unsplash.com/photo-1565299585323-38174c0b5e3a?w=800&h=600&fit=crop',
  'Burrito Grande': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&h=600&fit=crop',
  'Quesadillas (2 unidades)': 'https://images.unsplash.com/photo-1618040996337-56904b7850b0?w=800&h=600&fit=crop',
  'Flan Napolitano': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop',
  'Margarita': 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=800&h=600&fit=crop',
  'Horchata': 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop',
  
  // Greek Taverna
  'Gyro de Pollo': 'https://images.unsplash.com/photo-1606755962773-d324e7882b4e?w=800&h=600&fit=crop',
  'Moussaka': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop',
  'Souvlaki (2 brochetas)': 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=800&h=600&fit=crop',
  'Baklava': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop',
  'Ouzo': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop',
  
  // Indian Spice
  'Butter Chicken': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&h=600&fit=crop',
  'Lamb Curry': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&h=600&fit=crop',
  'Vegetable Biryani': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop',
  'Gulab Jamun': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop',
  'Mango Lassi': 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop',
  'Chai Masala': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop',
  
  // Seoul BBQ
  'Bulgogi': 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=800&h=600&fit=crop',
  'Bibimbap': 'https://images.unsplash.com/photo-1559314809-0d155014c29e?w=800&h=600&fit=crop',
  'Kimchi Jjigae': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop',
  'Bingsu': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&h=600&fit=crop',
  'Soju': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop',
  'Té de Cebada': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop',
};

async function updateMenuImages() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    const menuRepository = AppDataSource.getRepository(Menu);

    // Obtener todos los menús
    const menus = await menuRepository.find();
    console.log(`📋 Encontrados ${menus.length} menús`);

    let updated = 0;
    for (const menu of menus) {
      if (menuImages[menu.name]) {
        menu.image = menuImages[menu.name];
        await menuRepository.save(menu);
        updated++;
        console.log(`   ✅ Actualizado: ${menu.name}`);
      }
    }

    console.log(`\n🎉 ¡Actualización completada!`);
    console.log(`✅ ${updated} menús actualizados con imágenes`);

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

updateMenuImages();


