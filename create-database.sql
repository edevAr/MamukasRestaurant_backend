-- Script SQL para crear la base de datos y usuario
-- Ejecutar como superusuario: psql -U postgres -f create-database.sql

-- Crear base de datos
CREATE DATABASE restaurantes_db;

-- Crear usuario (opcional - puedes usar postgres)
-- CREATE USER restaurantes_user WITH PASSWORD 'tu_password_segura';

-- Dar permisos al usuario
-- GRANT ALL PRIVILEGES ON DATABASE restaurantes_db TO restaurantes_user;

-- Conectarse a la base de datos
\c restaurantes_db

-- Nota: TypeORM creará automáticamente las tablas cuando inicies el servidor
-- en modo desarrollo. No necesitas crear las tablas manualmente.

