# Backend - Restaurantes API

API REST construida con NestJS para la gestión de restaurantes.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar en desarrollo
npm run start:dev

# La API estará disponible en http://localhost:3000/api
```

## 📚 Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/verify` - Verificar token

### Restaurantes
- `GET /api/restaurants` - Listar restaurantes (con filtro de distancia)
- `GET /api/restaurants/:id` - Obtener restaurante
- `POST /api/restaurants` - Crear restaurante (Owner/Admin)
- `PATCH /api/restaurants/:id` - Actualizar restaurante
- `POST /api/restaurants/:id/promote` - Promocionar (Admin)

### Menús
- `GET /api/menus` - Listar menús
- `POST /api/menus` - Crear menú (Owner)
- `PATCH /api/menus/:id/availability` - Actualizar disponibilidad

### Pedidos
- `POST /api/orders` - Crear pedido (Client)
- `GET /api/orders` - Listar pedidos
- `PATCH /api/orders/:id/status` - Actualizar estado (Owner)

### Reseñas
- `POST /api/reviews` - Crear reseña (Client)
- `GET /api/reviews` - Listar reseñas
- `DELETE /api/reviews/:id` - Eliminar reseña (Client/Admin)

## 🔌 WebSocket

El servidor Socket.io está disponible en el mismo puerto (3000).

Eventos:
- `restaurant:status` - Cambio de estado del restaurante
- `menu:availability` - Cambio de disponibilidad de menú
- `order:status` - Actualización de estado de pedido
- `notification` - Notificación general

## 🗄️ Base de Datos

El backend utiliza **PostgreSQL** como base de datos principal y **Redis** para caché.

### Configuración Rápida

1. **Instalar PostgreSQL y Redis** (ver [SETUP_DATABASE.md](./SETUP_DATABASE.md))

2. **Crear la base de datos:**
   ```bash
   psql -U postgres
   CREATE DATABASE restaurantes_db;
   \q
   ```

3. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales
   ```

4. **Iniciar el servidor:**
   ```bash
   npm run start:dev
   ```

TypeORM crea automáticamente las tablas en desarrollo. Para producción, usar migraciones.

### Migraciones de Base de Datos

El proyecto incluye migraciones para mantener el esquema de la base de datos actualizado.

#### Ejecutar todas las migraciones

Para ejecutar todas las migraciones de una vez:

```bash
npm run migrate:all
```

Este comando ejecutará las siguientes migraciones en orden:

1. **Staff Role Fields** - Agrega campos `staffRole` y `restaurantId` a la tabla `users`
2. **Promotion Fields** - Agrega campos de promoción a `restaurants` y campos de respuesta a `reviews`
3. **Logo Field** - Agrega columna `logo` a la tabla `restaurants`
4. **Unique Constraints** - Agrega restricciones únicas para `name` y `email` en `restaurants`

#### Ejecutar migraciones individuales

Si necesitas ejecutar una migración específica:

```bash
# Migración de campos de staff
npm run migrate:staff

# Migración de campos de promoción
npm run migrate:promotion

# Migración de campo logo
npm run migrate:logo

# Migración de restricciones únicas
npm run migrate:unique
```

**Nota:** Las migraciones son idempotentes y pueden ejecutarse múltiples veces de forma segura. Si una migración ya está aplicada, se omitirá automáticamente.

**📖 Guía completa:** Ver [SETUP_DATABASE.md](./SETUP_DATABASE.md) para instrucciones detalladas.

## 📦 Estructura

```
src/
├── auth/           # Autenticación JWT
├── users/          # Usuarios
├── restaurants/    # Restaurantes
├── menus/          # Menús
├── orders/         # Pedidos
├── reviews/        # Reseñas
├── reservations/   # Reservas
├── promotions/     # Promociones
├── notifications/  # WebSocket Gateway
└── analytics/      # Analytics
```

# MamukasRestaurant_backend
