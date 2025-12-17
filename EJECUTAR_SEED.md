# 🌱 Ejecutar Seed de Base de Datos

Este script crea 10 restaurantes con sus menús, horarios de atención, ratings y reseñas en la base de datos.

## 📋 Requisitos

1. PostgreSQL debe estar corriendo
2. La base de datos `restaurantes_db` debe existir
3. El archivo `.env` debe estar configurado correctamente

## 🚀 Ejecutar el Seed

```bash
cd backend
npm run seed
```

## 📦 Datos que se crearán

- **10 Restaurantes** con diferentes tipos de cocina:
  - La Cocina Italiana
  - Sushi Master
  - Burger Paradise
  - El Asador Argentino
  - Thai Garden
  - Le Bistro Francais
  - Taco Loco
  - Greek Taverna
  - Indian Spice
  - Seoul BBQ

- **10 Propietarios** (uno por restaurante)
  - Email: `[nombre]@restaurant.com`
  - Contraseña: `password123`
  - Rol: OWNER

- **6 Menús por restaurante** (60 menús en total)
  - Platos principales
  - Bebidas
  - Postres

- **10-30 Reseñas por restaurante** (100-300 reseñas en total)
  - Ratings de 4-5 estrellas
  - Comentarios de ejemplo

## ⚠️ Advertencia

El script **eliminará** todos los datos existentes de:
- Reseñas
- Menús
- Restaurantes
- Usuarios propietarios (solo los que tienen email `@restaurant.com`)

## ✅ Verificar

Después de ejecutar el seed, puedes verificar los datos:

```bash
# Conectarse a PostgreSQL
psql -U postgres -d restaurantes_db

# Contar restaurantes
SELECT COUNT(*) FROM restaurants;

# Ver restaurantes
SELECT name, cuisine, rating FROM restaurants;

# Ver menús de un restaurante
SELECT m.name, m.price, m.type 
FROM menus m 
JOIN restaurants r ON m."restaurantId" = r.id 
WHERE r.name = 'La Cocina Italiana';
```

## 🔐 Credenciales de Propietarios

Todos los propietarios tienen la misma contraseña: `password123`

Puedes iniciar sesión con cualquiera de estos emails:
- marco.rossi@restaurant.com
- hiroshi.tanaka@restaurant.com
- john.smith@restaurant.com
- carlos.mendoza@restaurant.com
- siriwan.wong@restaurant.com
- pierre.dubois@restaurant.com
- maria.rodriguez@restaurant.com
- dimitri.papadopoulos@restaurant.com
- raj.patel@restaurant.com
- minjun.kim@restaurant.com

