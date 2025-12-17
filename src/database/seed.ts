import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Menu } from '../menus/entities/menu.entity';
import { Review } from '../reviews/entities/review.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Role } from '../common/enums/role.enum';
import { MenuItemType } from '../menus/entities/menu.entity';
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

interface RestaurantData {
  name: string;
  cuisine: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  rating: number;
  ownerName: string;
  ownerEmail: string;
  openingHours: any;
  image?: string;
  logo?: string;
  menus: Array<{
    name: string;
    description: string;
    price: number;
    type: MenuItemType;
    available: boolean;
    quantity: number;
    image?: string;
  }>;
}

const restaurantsData: RestaurantData[] = [
  {
    name: 'La Cocina Italiana',
    cuisine: 'Italiana',
    description: 'Auténtica cocina italiana con ingredientes frescos importados de Italia',
    address: 'Av. Principal 123, Ciudad',
    phone: '+1 234 567 8901',
    email: 'italiana@restaurant.com',
    latitude: 40.7128,
    longitude: -74.0060,
    rating: 4.8,
    ownerName: 'Marco Rossi',
    ownerEmail: 'marco.rossi@restaurant.com',
    openingHours: {
      monday: { open: true, openTime: '11:00', closeTime: '22:00' },
      tuesday: { open: true, openTime: '11:00', closeTime: '22:00' },
      wednesday: { open: true, openTime: '11:00', closeTime: '22:00' },
      thursday: { open: true, openTime: '11:00', closeTime: '22:00' },
      friday: { open: true, openTime: '11:00', closeTime: '23:00' },
      saturday: { open: true, openTime: '11:00', closeTime: '23:00' },
      sunday: { open: true, openTime: '12:00', closeTime: '21:00' },
    },
    menus: [
      { name: 'Spaghetti Carbonara', description: 'Pasta con pancetta, huevo y queso parmesano', price: 18.99, type: MenuItemType.FOOD, available: true, quantity: 50, image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop' },
      { name: 'Pizza Margherita', description: 'Pizza clásica con tomate, mozzarella y albahaca', price: 14.99, type: MenuItemType.FOOD, available: true, quantity: 30, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=600&fit=crop' },
      { name: 'Lasagna Tradicional', description: 'Capas de pasta, carne y queso con salsa boloñesa', price: 19.99, type: MenuItemType.FOOD, available: true, quantity: 25, image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&h=600&fit=crop' },
      { name: 'Tiramisú', description: 'Postre italiano con café y mascarpone', price: 8.99, type: MenuItemType.DESSERT, available: true, quantity: 40, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop' },
      { name: 'Vino Tinto', description: 'Vino italiano de la casa', price: 12.99, type: MenuItemType.DRINK, available: true, quantity: 100, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop' },
      { name: 'Coca Cola', description: 'Refresco de cola', price: 3.99, type: MenuItemType.DRINK, available: true, quantity: 200, image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&h=600&fit=crop' },
    ],
  },
  {
    name: 'Sushi Master',
    cuisine: 'Japonesa',
    description: 'Sushi fresco preparado por chefs japoneses certificados',
    address: 'Calle Sushi 456, Ciudad',
    phone: '+1 234 567 8902',
    email: 'sushi@restaurant.com',
    latitude: 40.7580,
    longitude: -73.9855,
    rating: 4.9,
    ownerName: 'Hiroshi Tanaka',
    ownerEmail: 'hiroshi.tanaka@restaurant.com',
    openingHours: {
      monday: { open: '12:00', close: '22:00' },
      tuesday: { open: '12:00', close: '22:00' },
      wednesday: { open: '12:00', close: '22:00' },
      thursday: { open: '12:00', close: '22:00' },
      friday: { open: '12:00', close: '23:00' },
      saturday: { open: '12:00', close: '23:00' },
      sunday: { open: '12:00', close: '21:00' },
    },
    menus: [
      { name: 'Sushi Roll California', description: 'Roll con cangrejo, aguacate y pepino', price: 12.99, type: MenuItemType.FOOD, available: true, quantity: 60, image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop' },
      { name: 'Sashimi de Salmón', description: 'Salmón fresco cortado en láminas', price: 16.99, type: MenuItemType.FOOD, available: true, quantity: 40, image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop' },
      { name: 'Ramen Tonkotsu', description: 'Sopa de fideos con cerdo y huevo', price: 15.99, type: MenuItemType.FOOD, available: true, quantity: 35, image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop' },
      { name: 'Mochi de Fresa', description: 'Postre japonés de arroz con fresa', price: 6.99, type: MenuItemType.DESSERT, available: true, quantity: 50, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop' },
      { name: 'Sake Premium', description: 'Sake japonés de alta calidad', price: 18.99, type: MenuItemType.DRINK, available: true, quantity: 80, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop' },
      { name: 'Té Verde', description: 'Té verde japonés tradicional', price: 4.99, type: MenuItemType.DRINK, available: true, quantity: 150, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop' },
    ],
  },
  {
    name: 'Burger Paradise',
    cuisine: 'Americana',
    description: 'Las mejores hamburguesas gourmet de la ciudad',
    address: 'Boulevard Burger 789, Ciudad',
    phone: '+1 234 567 8903',
    email: 'burger@restaurant.com',
    latitude: 40.7505,
    longitude: -73.9934,
    rating: 4.7,
    ownerName: 'John Smith',
    ownerEmail: 'john.smith@restaurant.com',
    openingHours: {
      monday: { open: '11:00', close: '23:00' },
      tuesday: { open: '11:00', close: '23:00' },
      wednesday: { open: '11:00', close: '23:00' },
      thursday: { open: '11:00', close: '23:00' },
      friday: { open: '11:00', close: '00:00' },
      saturday: { open: '11:00', close: '00:00' },
      sunday: { open: '12:00', close: '22:00' },
    },
    menus: [
      { name: 'Burger Clásica', description: 'Carne, lechuga, tomate, cebolla y salsa especial', price: 11.99, type: MenuItemType.FOOD, available: true, quantity: 100, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop' },
      { name: 'Burger BBQ', description: 'Carne, bacon, queso cheddar y salsa BBQ', price: 13.99, type: MenuItemType.FOOD, available: true, quantity: 80, image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=600&fit=crop' },
      { name: 'Papas Fritas', description: 'Papas fritas crujientes con sal', price: 4.99, type: MenuItemType.FOOD, available: true, quantity: 200, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=600&fit=crop' },
      { name: 'Brownie con Helado', description: 'Brownie caliente con helado de vainilla', price: 7.99, type: MenuItemType.DESSERT, available: true, quantity: 60, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&h=600&fit=crop' },
      { name: 'Cerveza Artesanal', description: 'Cerveza local de la casa', price: 6.99, type: MenuItemType.DRINK, available: true, quantity: 150, image: 'https://images.unsplash.com/photo-1535958637004-0327e845cfee?w=800&h=600&fit=crop' },
      { name: 'Refresco', description: 'Coca Cola, Sprite o Fanta', price: 3.49, type: MenuItemType.DRINK, available: true, quantity: 300, image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&h=600&fit=crop' },
    ],
  },
  {
    name: 'El Asador Argentino',
    cuisine: 'Argentina',
    description: 'Carnes a la parrilla y platos tradicionales argentinos',
    address: 'Av. Gaucho 321, Ciudad',
    phone: '+1 234 567 8904',
    email: 'asador@restaurant.com',
    latitude: 40.7282,
    longitude: -73.9942,
    rating: 4.6,
    ownerName: 'Carlos Mendoza',
    ownerEmail: 'carlos.mendoza@restaurant.com',
    openingHours: {
      monday: { open: '18:00', close: '23:00' },
      tuesday: { open: '18:00', close: '23:00' },
      wednesday: { open: '18:00', close: '23:00' },
      thursday: { open: '18:00', close: '23:00' },
      friday: { open: '18:00', close: '00:00' },
      saturday: { open: '18:00', close: '00:00' },
      sunday: { open: '18:00', close: '22:00' },
    },
    menus: [
      { name: 'Bife de Chorizo', description: 'Corte premium a la parrilla con papas', price: 24.99, type: MenuItemType.FOOD, available: true, quantity: 30, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop' },
      { name: 'Asado de Tira', description: 'Costillas de res a la parrilla', price: 22.99, type: MenuItemType.FOOD, available: true, quantity: 25, image: 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=800&h=600&fit=crop' },
      { name: 'Empanadas (3 unidades)', description: 'Empanadas de carne, pollo o queso', price: 9.99, type: MenuItemType.FOOD, available: true, quantity: 80, image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&h=600&fit=crop' },
      { name: 'Flan Casero', description: 'Flan tradicional con dulce de leche', price: 6.99, type: MenuItemType.DESSERT, available: true, quantity: 40, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop' },
      { name: 'Vino Malbec', description: 'Vino tinto argentino', price: 15.99, type: MenuItemType.DRINK, available: true, quantity: 90, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop' },
      { name: 'Agua Mineral', description: 'Agua sin gas', price: 2.99, type: MenuItemType.DRINK, available: true, quantity: 200, image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop' },
    ],
  },
  {
    name: 'Thai Garden',
    cuisine: 'Tailandesa',
    description: 'Sabores auténticos de Tailandia con ingredientes frescos',
    address: 'Street Thai 654, Ciudad',
    phone: '+1 234 567 8905',
    email: 'thai@restaurant.com',
    latitude: 40.7614,
    longitude: -73.9776,
    rating: 4.8,
    ownerName: 'Siriwan Wong',
    ownerEmail: 'siriwan.wong@restaurant.com',
    openingHours: {
      monday: { open: '11:30', close: '22:00' },
      tuesday: { open: '11:30', close: '22:00' },
      wednesday: { open: '11:30', close: '22:00' },
      thursday: { open: '11:30', close: '22:00' },
      friday: { open: '11:30', close: '23:00' },
      saturday: { open: '11:30', close: '23:00' },
      sunday: { open: '12:00', close: '21:30' },
    },
    menus: [
      { name: 'Pad Thai', description: 'Fideos salteados con camarones y vegetales', price: 16.99, type: MenuItemType.FOOD, available: true, quantity: 45, image: 'https://images.unsplash.com/photo-1559314809-0d155014c29e?w=800&h=600&fit=crop' },
      { name: 'Curry Verde', description: 'Curry verde con pollo y arroz', price: 17.99, type: MenuItemType.FOOD, available: true, quantity: 40, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&h=600&fit=crop' },
      { name: 'Tom Yum Soup', description: 'Sopa picante y agria con camarones', price: 14.99, type: MenuItemType.FOOD, available: true, quantity: 50, image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop' },
      { name: 'Mango Sticky Rice', description: 'Arroz glutinoso con mango y leche de coco', price: 7.99, type: MenuItemType.DESSERT, available: true, quantity: 35, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop' },
      { name: 'Thai Iced Tea', description: 'Té tailandés helado con leche', price: 5.99, type: MenuItemType.DRINK, available: true, quantity: 120, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop' },
      { name: 'Agua de Coco', description: 'Coco fresco natural', price: 4.99, type: MenuItemType.DRINK, available: true, quantity: 100, image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop' },
    ],
  },
  {
    name: 'Le Bistro Francais',
    cuisine: 'Francesa',
    description: 'Cocina francesa clásica en un ambiente elegante',
    address: 'Rue Paris 987, Ciudad',
    phone: '+1 234 567 8906',
    email: 'bistro@restaurant.com',
    latitude: 40.7489,
    longitude: -73.9680,
    rating: 4.9,
    ownerName: 'Pierre Dubois',
    ownerEmail: 'pierre.dubois@restaurant.com',
    openingHours: {
      monday: { open: '12:00', close: '22:00' },
      tuesday: { open: '12:00', close: '22:00' },
      wednesday: { open: '12:00', close: '22:00' },
      thursday: { open: '12:00', close: '22:00' },
      friday: { open: '12:00', close: '23:00' },
      saturday: { open: '12:00', close: '23:00' },
      sunday: { open: '12:00', close: '21:00' },
    },
    menus: [
      { name: 'Coq au Vin', description: 'Pollo cocido en vino tinto con vegetales', price: 26.99, type: MenuItemType.FOOD, available: true, quantity: 20, image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop' },
      { name: 'Boeuf Bourguignon', description: 'Estofado de res con vino y vegetales', price: 28.99, type: MenuItemType.FOOD, available: true, quantity: 18, image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop' },
      { name: 'Ratatouille', description: 'Verduras provenzales al horno', price: 15.99, type: MenuItemType.FOOD, available: true, quantity: 30, image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop' },
      { name: 'Crème Brûlée', description: 'Postre clásico francés con caramelo', price: 9.99, type: MenuItemType.DESSERT, available: true, quantity: 35, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop' },
      { name: 'Vino Bordeaux', description: 'Vino tinto francés', price: 22.99, type: MenuItemType.DRINK, available: true, quantity: 60, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop' },
      { name: 'Café au Lait', description: 'Café con leche estilo francés', price: 4.99, type: MenuItemType.DRINK, available: true, quantity: 150, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=600&fit=crop' },
    ],
  },
  {
    name: 'Taco Loco',
    cuisine: 'Mexicana',
    description: 'Tacos auténticos y comida mexicana tradicional',
    address: 'Calle Taco 147, Ciudad',
    phone: '+1 234 567 8907',
    email: 'taco@restaurant.com',
    latitude: 40.7589,
    longitude: -73.9851,
    rating: 4.5,
    ownerName: 'Maria Rodriguez',
    ownerEmail: 'maria.rodriguez@restaurant.com',
    openingHours: {
      monday: { open: true, openTime: '11:00', closeTime: '22:00' },
      tuesday: { open: true, openTime: '11:00', closeTime: '22:00' },
      wednesday: { open: true, openTime: '11:00', closeTime: '22:00' },
      thursday: { open: true, openTime: '11:00', closeTime: '22:00' },
      friday: { open: true, openTime: '11:00', closeTime: '23:00' },
      saturday: { open: true, openTime: '11:00', closeTime: '23:00' },
      sunday: { open: true, openTime: '12:00', closeTime: '21:00' },
    },
    menus: [
      { name: 'Tacos al Pastor (3 unidades)', description: 'Tacos con carne de cerdo marinada y piña', price: 10.99, type: MenuItemType.FOOD, available: true, quantity: 100, image: 'https://images.unsplash.com/photo-1565299585323-38174c0b5e3a?w=800&h=600&fit=crop' },
      { name: 'Burrito Grande', description: 'Burrito con carne, frijoles, arroz y queso', price: 12.99, type: MenuItemType.FOOD, available: true, quantity: 70, image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&h=600&fit=crop' },
      { name: 'Quesadillas (2 unidades)', description: 'Tortilla con queso derretido', price: 8.99, type: MenuItemType.FOOD, available: true, quantity: 90, image: 'https://images.unsplash.com/photo-1618040996337-56904b7850b0?w=800&h=600&fit=crop' },
      { name: 'Flan Napolitano', description: 'Flan con caramelo', price: 5.99, type: MenuItemType.DESSERT, available: true, quantity: 50, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop' },
      { name: 'Margarita', description: 'Cóctel de tequila, limón y triple sec', price: 9.99, type: MenuItemType.DRINK, available: true, quantity: 80, image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=800&h=600&fit=crop' },
      { name: 'Horchata', description: 'Bebida de arroz con canela', price: 4.99, type: MenuItemType.DRINK, available: true, quantity: 120, image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop' },
    ],
  },
  {
    name: 'Greek Taverna',
    cuisine: 'Griega',
    description: 'Sabores mediterráneos auténticos de Grecia',
    address: 'Plaza Grecia 258, Ciudad',
    phone: '+1 234 567 8908',
    email: 'greek@restaurant.com',
    latitude: 40.7411,
    longitude: -73.9897,
    rating: 4.7,
    ownerName: 'Dimitri Papadopoulos',
    ownerEmail: 'dimitri.papadopoulos@restaurant.com',
    openingHours: {
      monday: { open: '12:00', close: '22:00' },
      tuesday: { open: '12:00', close: '22:00' },
      wednesday: { open: '12:00', close: '22:00' },
      thursday: { open: '12:00', close: '22:00' },
      friday: { open: '12:00', close: '23:00' },
      saturday: { open: '12:00', close: '23:00' },
      sunday: { open: '12:00', close: '21:00' },
    },
    menus: [
      { name: 'Gyro de Pollo', description: 'Carne de pollo con tzatziki en pan pita', price: 13.99, type: MenuItemType.FOOD, available: true, quantity: 60, image: 'https://images.unsplash.com/photo-1606755962773-d324e7882b4e?w=800&h=600&fit=crop' },
      { name: 'Moussaka', description: 'Pastel de berenjena, carne y bechamel', price: 18.99, type: MenuItemType.FOOD, available: true, quantity: 30, image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop' },
      { name: 'Souvlaki (2 brochetas)', description: 'Brochetas de pollo a la parrilla', price: 15.99, type: MenuItemType.FOOD, available: true, quantity: 40, image: 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=800&h=600&fit=crop' },
      { name: 'Baklava', description: 'Postre de hojaldre con miel y nueces', price: 7.99, type: MenuItemType.DESSERT, available: true, quantity: 45, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop' },
      { name: 'Ouzo', description: 'Licor anisado griego', price: 8.99, type: MenuItemType.DRINK, available: true, quantity: 70, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop' },
      { name: 'Agua Mineral', description: 'Agua sin gas', price: 2.99, type: MenuItemType.DRINK, available: true, quantity: 200, image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop' },
    ],
  },
  {
    name: 'Indian Spice',
    cuisine: 'India',
    description: 'Curries y platos indios auténticos con especias frescas',
    address: 'Street India 369, Ciudad',
    phone: '+1 234 567 8909',
    email: 'indian@restaurant.com',
    latitude: 40.7505,
    longitude: -73.9934,
    rating: 4.6,
    ownerName: 'Raj Patel',
    ownerEmail: 'raj.patel@restaurant.com',
    openingHours: {
      monday: { open: '11:30', close: '22:30' },
      tuesday: { open: '11:30', close: '22:30' },
      wednesday: { open: '11:30', close: '22:30' },
      thursday: { open: '11:30', close: '22:30' },
      friday: { open: '11:30', close: '23:30' },
      saturday: { open: '11:30', close: '23:30' },
      sunday: { open: '12:00', close: '22:00' },
    },
    menus: [
      { name: 'Butter Chicken', description: 'Pollo en salsa de mantequilla y tomate', price: 17.99, type: MenuItemType.FOOD, available: true, quantity: 50, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&h=600&fit=crop' },
      { name: 'Lamb Curry', description: 'Curry de cordero con especias', price: 19.99, type: MenuItemType.FOOD, available: true, quantity: 35, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&h=600&fit=crop' },
      { name: 'Vegetable Biryani', description: 'Arroz basmati con vegetales y especias', price: 14.99, type: MenuItemType.FOOD, available: true, quantity: 40, image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop' },
      { name: 'Gulab Jamun', description: 'Bolitas de leche fritas en almíbar', price: 6.99, type: MenuItemType.DESSERT, available: true, quantity: 55, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop' },
      { name: 'Mango Lassi', description: 'Bebida de yogur con mango', price: 5.99, type: MenuItemType.DRINK, available: true, quantity: 100, image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop' },
      { name: 'Chai Masala', description: 'Té especiado indio', price: 4.99, type: MenuItemType.DRINK, available: true, quantity: 150, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop' },
    ],
  },
  {
    name: 'Seoul BBQ',
    cuisine: 'Coreana',
    description: 'Barbacoa coreana y platos tradicionales',
    address: 'Korea Street 741, Ciudad',
    phone: '+1 234 567 8910',
    email: 'seoul@restaurant.com',
    latitude: 40.7282,
    longitude: -73.9942,
    rating: 4.8,
    ownerName: 'Min-jun Kim',
    ownerEmail: 'minjun.kim@restaurant.com',
    openingHours: {
      monday: { open: '17:00', close: '23:00' },
      tuesday: { open: '17:00', close: '23:00' },
      wednesday: { open: '17:00', close: '23:00' },
      thursday: { open: '17:00', close: '23:00' },
      friday: { open: '17:00', close: '00:00' },
      saturday: { open: '17:00', close: '00:00' },
      sunday: { open: '17:00', close: '22:00' },
    },
    menus: [
      { name: 'Bulgogi', description: 'Carne de res marinada a la parrilla', price: 21.99, type: MenuItemType.FOOD, available: true, quantity: 40, image: 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=800&h=600&fit=crop' },
      { name: 'Bibimbap', description: 'Arroz con vegetales, carne y huevo', price: 16.99, type: MenuItemType.FOOD, available: true, quantity: 45, image: 'https://images.unsplash.com/photo-1559314809-0d155014c29e?w=800&h=600&fit=crop' },
      { name: 'Kimchi Jjigae', description: 'Estofado de kimchi con cerdo', price: 15.99, type: MenuItemType.FOOD, available: true, quantity: 50, image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop' },
      { name: 'Bingsu', description: 'Postre de hielo raspado con frutas', price: 8.99, type: MenuItemType.DESSERT, available: true, quantity: 35, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&h=600&fit=crop' },
      { name: 'Soju', description: 'Licor coreano tradicional', price: 12.99, type: MenuItemType.DRINK, available: true, quantity: 90, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop' },
      { name: 'Té de Cebada', description: 'Té coreano de cebada tostada', price: 3.99, type: MenuItemType.DRINK, available: true, quantity: 150, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop' },
    ],
  },
];

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    const userRepository = AppDataSource.getRepository(User);
    const restaurantRepository = AppDataSource.getRepository(Restaurant);
    const menuRepository = AppDataSource.getRepository(Menu);
    const reviewRepository = AppDataSource.getRepository(Review);

    // Limpiar datos existentes
    console.log('🧹 Limpiando datos existentes...');
    try {
      // Primero eliminar reseñas y menús que dependen de restaurantes
      await reviewRepository.delete({});
      await menuRepository.delete({});
      
      // Eliminar restaurantes (esto también eliminará las relaciones)
      await restaurantRepository.delete({});
      
      // Eliminar usuarios propietarios existentes con email @restaurant.com
      const existingOwners = await userRepository.find({ 
        where: { role: Role.OWNER } 
      });
      for (const owner of existingOwners) {
        if (owner.email.includes('@restaurant.com')) {
          await userRepository.delete(owner.id);
          console.log(`   🗑️  Eliminado usuario: ${owner.email}`);
        }
      }
      console.log('   ✅ Limpieza completada');
    } catch (error) {
      console.log('   ⚠️  Error durante la limpieza:', error.message);
      // Continuar de todas formas
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Crear hash de contraseña una vez para reutilizar
    const hashedPassword = await bcrypt.hash('password123', 10);

    for (const data of restaurantsData) {
      console.log(`\n📝 Creando restaurante: ${data.name}`);

      // Verificar si el usuario propietario ya existe
      let savedOwner = await userRepository.findOne({ 
        where: { email: data.ownerEmail } 
      });

      if (savedOwner) {
        // Si existe, actualizar la contraseña y datos
        console.log(`   🔄 Usuario existente encontrado: ${data.ownerEmail}`);
        savedOwner.password = hashedPassword;
        savedOwner.firstName = data.ownerName.split(' ')[0];
        savedOwner.lastName = data.ownerName.split(' ').slice(1).join(' ') || '';
        savedOwner.role = Role.OWNER;
        savedOwner.isActive = true;
        savedOwner = await userRepository.save(savedOwner);
        console.log(`   ✅ Propietario actualizado: ${savedOwner.email}`);
      } else {
        // Si no existe, crear nuevo usuario
        const owner = userRepository.create({
          email: data.ownerEmail,
          password: hashedPassword,
          firstName: data.ownerName.split(' ')[0],
          lastName: data.ownerName.split(' ').slice(1).join(' ') || '',
          role: Role.OWNER,
          isActive: true,
        });
        savedOwner = await userRepository.save(owner);
        console.log(`   ✅ Propietario creado: ${savedOwner.email}`);
      }

      // Crear restaurante
      const restaurant = restaurantRepository.create({
        name: data.name,
        cuisine: data.cuisine,
        description: data.description,
        address: data.address,
        phone: data.phone,
        email: data.email,
        latitude: data.latitude,
        longitude: data.longitude,
        rating: data.rating,
        ownerId: savedOwner.id,
        isActive: true,
        isOpen: true,
        openingHours: data.openingHours,
      });
      const savedRestaurant = await restaurantRepository.save(restaurant);
      console.log(`   ✅ Restaurante creado: ${savedRestaurant.name}`);

      // Crear menús
      for (const menuData of data.menus) {
        const menu = menuRepository.create({
          name: menuData.name,
          description: menuData.description,
          price: menuData.price,
          type: menuData.type,
          available: menuData.available,
          quantity: menuData.quantity,
          image: menuData.image,
          date: today,
          restaurantId: savedRestaurant.id,
        });
        await menuRepository.save(menu);
      }
      console.log(`   ✅ ${data.menus.length} platos creados`);

      // Crear algunas reseñas de ejemplo
      const reviewCount = Math.floor(Math.random() * 20) + 10; // 10-30 reseñas
      for (let i = 0; i < reviewCount; i++) {
        // Buscar o crear cliente
        let client = await userRepository.findOne({ where: { email: `client${i}@example.com` } });
        if (!client) {
          client = userRepository.create({
            email: `client${i}@example.com`,
            password: hashedPassword,
            firstName: `Cliente${i}`,
            lastName: 'Test',
            role: Role.CLIENT,
            isActive: true,
          });
          client = await userRepository.save(client);
        }

        const review = reviewRepository.create({
          rating: Math.floor(Math.random() * 2) + 4, // 4-5 estrellas
          comment: `Excelente restaurante! ${data.name} es increíble.`,
          restaurantId: savedRestaurant.id,
          clientId: client.id,
        });
        await reviewRepository.save(review);
      }
      console.log(`   ✅ ${reviewCount} reseñas creadas`);
    }

    console.log('\n🎉 ¡Seed completado exitosamente!');
    console.log(`✅ ${restaurantsData.length} restaurantes creados`);
    console.log(`✅ Todos los propietarios tienen la contraseña: password123`);

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

seed();

