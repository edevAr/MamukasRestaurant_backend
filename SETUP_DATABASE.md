# 🗄️ Configuración de Base de Datos

El backend utiliza **PostgreSQL** como base de datos principal y **Redis** para caché y sesiones.

## 📋 Requisitos

- **PostgreSQL** >= 12 (recomendado: 14 o superior)
- **Redis** >= 6 (opcional pero recomendado)

## 🐘 Instalación de PostgreSQL

### macOS (usando Homebrew)

```bash
# Instalar PostgreSQL
brew install postgresql@14

# Iniciar PostgreSQL
brew services start postgresql@14

# Verificar instalación
psql --version
```

### Linux (Ubuntu/Debian)

```bash
# Actualizar paquetes
sudo apt update

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib

# Iniciar servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verificar
sudo -u postgres psql --version
```

### Windows

1. Descargar desde: https://www.postgresql.org/download/windows/
2. Ejecutar el instalador
3. Seguir las instrucciones del asistente
4. Recordar la contraseña del usuario `postgres`

## 🔴 Instalación de Redis

### macOS (usando Homebrew)

```bash
# Instalar Redis
brew install redis

# Iniciar Redis
brew services start redis

# Verificar
redis-cli ping
# Debería responder: PONG
```

### Linux (Ubuntu/Debian)

```bash
# Instalar Redis
sudo apt install redis-server

# Iniciar servicio
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verificar
redis-cli ping
```

### Windows

1. Descargar desde: https://github.com/microsoftarchive/redis/releases
2. O usar WSL2 con Redis

## ⚙️ Configuración de PostgreSQL

### 1. Crear la base de datos

```bash
# Conectarse a PostgreSQL
psql -U postgres

# O en Linux
sudo -u postgres psql
```

Dentro de PostgreSQL:

```sql
-- Crear base de datos
CREATE DATABASE restaurantes_db;

-- Crear usuario (opcional, puedes usar postgres)
CREATE USER restaurantes_user WITH PASSWORD 'tu_password_segura';

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE restaurantes_db TO restaurantes_user;

-- Salir
\q
```

### 2. Verificar conexión

```bash
# Probar conexión
psql -U postgres -d restaurantes_db

# O con usuario personalizado
psql -U restaurantes_user -d restaurantes_db
```

## 🔧 Configurar variables de entorno

1. Copiar el archivo de ejemplo:

```bash
cd backend
cp .env.example .env
```

2. Editar `.env` con tus credenciales:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=restaurantes_db

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=tu-secret-key-super-segura-minimo-32-caracteres
JWT_EXPIRES_IN=7d

PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
```

## 🚀 Inicializar la base de datos

TypeORM creará automáticamente las tablas cuando inicies el servidor en modo desarrollo:

```bash
cd backend
npm run start:dev
```

Verás mensajes como:
```
[Nest] LOG [TypeOrmModule] Connected to postgres database successfully
```

## 📊 Verificar tablas creadas

```bash
# Conectarse a la base de datos
psql -U postgres -d restaurantes_db

# Listar tablas
\dt

# Ver estructura de una tabla
\d users

# Salir
\q
```

## 🔍 Solución de Problemas

### Error: "password authentication failed"

1. Verificar que la contraseña en `.env` sea correcta
2. Verificar configuración de `pg_hba.conf` en PostgreSQL
3. Reiniciar PostgreSQL: `brew services restart postgresql@14`

### Error: "database does not exist"

```bash
# Crear la base de datos manualmente
psql -U postgres
CREATE DATABASE restaurantes_db;
\q
```

### Error: "connection refused" (Redis)

```bash
# Verificar que Redis esté corriendo
redis-cli ping

# Si no responde, iniciar Redis
brew services start redis  # macOS
sudo systemctl start redis-server  # Linux
```

### Redis es opcional

Si no quieres usar Redis, puedes comentar la configuración en `src/app.module.ts`:

```typescript
// Comentar estas líneas si no usas Redis
// CacheModule.registerAsync({...}),
```

## 🎯 Comandos Útiles

### PostgreSQL

```bash
# Iniciar PostgreSQL
brew services start postgresql@14  # macOS
sudo systemctl start postgresql    # Linux

# Detener PostgreSQL
brew services stop postgresql@14   # macOS
sudo systemctl stop postgresql     # Linux

# Reiniciar PostgreSQL
brew services restart postgresql@14  # macOS
sudo systemctl restart postgresql    # Linux

# Ver estado
brew services list  # macOS
sudo systemctl status postgresql  # Linux
```

### Redis

```bash
# Iniciar Redis
brew services start redis  # macOS
sudo systemctl start redis-server  # Linux

# Detener Redis
brew services stop redis  # macOS
sudo systemctl stop redis-server  # Linux

# Conectarse a Redis CLI
redis-cli

# Dentro de Redis CLI
PING        # Verificar conexión
KEYS *      # Ver todas las claves
FLUSHALL    # Limpiar todo (cuidado!)
```

## 📝 Notas Importantes

1. **En desarrollo**: TypeORM crea las tablas automáticamente (`synchronize: true`)
2. **En producción**: Usa migraciones, NO uses `synchronize: true`
3. **JWT_SECRET**: Debe ser una cadena larga y segura (mínimo 32 caracteres)
4. **Redis**: Mejora el rendimiento pero no es estrictamente necesario para desarrollo

## ✅ Verificación Final

Después de configurar todo, verifica:

```bash
# 1. PostgreSQL está corriendo
psql -U postgres -c "SELECT version();"

# 2. Redis está corriendo
redis-cli ping

# 3. Base de datos existe
psql -U postgres -l | grep restaurantes_db

# 4. Iniciar backend
cd backend
npm run start:dev

# Deberías ver:
# [Nest] LOG [TypeOrmModule] Connected to postgres database successfully
```

¡Listo! Tu base de datos está configurada. 🎉

