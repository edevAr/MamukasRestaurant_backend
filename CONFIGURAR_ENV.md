# ⚙️ Configuración del archivo .env

El archivo `.env` contiene todas las variables de entorno necesarias para que el backend funcione correctamente.

## 📝 Ubicación

El archivo debe estar en: `backend/.env`

## 🔧 Variables a Configurar

### 1. Base de Datos PostgreSQL (OBLIGATORIO)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres          # Tu usuario de PostgreSQL
DB_PASSWORD=tu_password       # Tu contraseña de PostgreSQL
DB_DATABASE=restaurantes_db   # Nombre de la base de datos
```

**⚠️ IMPORTANTE:** 
- `DB_PASSWORD` debe ser una cadena de texto (string), no puede estar vacía
- Si no tienes contraseña, usa `DB_PASSWORD=` (vacío) o `DB_PASSWORD=postgres` (por defecto)

### 2. Redis (OPCIONAL pero recomendado)

```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

Si no tienes Redis instalado, puedes dejar estos valores. El sistema usará caché en memoria.

### 3. JWT Secret (OBLIGATORIO)

```env
JWT_SECRET=tu-secret-key-super-segura-minimo-32-caracteres
```

**⚠️ IMPORTANTE:** 
- Debe tener al menos 32 caracteres
- Debe ser una cadena única y secreta
- NO uses el valor por defecto en producción

### 4. Configuración de la Aplicación

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
```

## 🚀 Pasos para Configurar

### Paso 1: Crear el archivo .env

```bash
cd backend
cp .env.example .env
```

O si no existe .env.example, crea el archivo manualmente.

### Paso 2: Editar las credenciales

Abre el archivo `.env` y modifica:

1. **DB_PASSWORD**: Tu contraseña de PostgreSQL
   - Si instalaste PostgreSQL con el instalador oficial, es la contraseña que configuraste
   - Si usas Docker: generalmente es `postgres`
   - Si no tienes contraseña: déjalo vacío `DB_PASSWORD=`

2. **DB_USERNAME**: Tu usuario de PostgreSQL
   - Por defecto: `postgres`
   - Si creaste un usuario personalizado, úsalo aquí

3. **JWT_SECRET**: Genera una clave secreta segura
   ```bash
   # Puedes generar una con:
   openssl rand -base64 32
   ```

### Paso 3: Verificar la configuración

```bash
cd backend
./check-database.sh
```

Este script verificará:
- ✅ PostgreSQL está corriendo
- ✅ La base de datos existe
- ✅ Las variables de entorno están configuradas

## 🔍 Solución de Problemas

### Error: "client password must be a string"

**Causa:** La contraseña en `.env` no es una cadena válida o está vacía.

**Solución:**
1. Abre `backend/.env`
2. Asegúrate de que `DB_PASSWORD` tenga un valor:
   ```env
   DB_PASSWORD=postgres
   ```
   O si no tienes contraseña:
   ```env
   DB_PASSWORD=
   ```
3. No dejes espacios alrededor del `=`
4. No uses comillas a menos que sea necesario

### Error: "password authentication failed"

**Causa:** La contraseña en `.env` no coincide con la de PostgreSQL.

**Solución:**
1. Verifica tu contraseña de PostgreSQL:
   ```bash
   psql -U postgres
   # Te pedirá la contraseña
   ```
2. Actualiza `DB_PASSWORD` en `.env` con la contraseña correcta

### Error: "database does not exist"

**Causa:** La base de datos no ha sido creada.

**Solución:**
```bash
psql -U postgres
CREATE DATABASE restaurantes_db;
\q
```

## 📋 Ejemplo de .env Completo

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=mi_password_segura
DB_DATABASE=restaurantes_db

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=mi-super-secret-key-muy-larga-y-segura-de-al-menos-32-caracteres-123456789
JWT_EXPIRES_IN=7d

# App Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
```

## ✅ Verificación Final

Después de configurar `.env`, verifica:

```bash
cd backend
npm run start:dev
```

Deberías ver:
```
[Nest] LOG [TypeOrmModule] Connected to postgres database successfully
```

Si ves errores, revisa:
1. PostgreSQL está corriendo
2. La base de datos existe
3. Las credenciales en `.env` son correctas
4. No hay espacios extra en las variables

