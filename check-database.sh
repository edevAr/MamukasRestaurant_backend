#!/bin/bash

# Script para verificar la configuración de PostgreSQL y Redis

echo "🔍 Verificando configuración de bases de datos..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar PostgreSQL
echo "📊 PostgreSQL:"
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version | head -n1)
    echo "  ${GREEN}✓${NC} PostgreSQL instalado: $PSQL_VERSION"
    
    # Intentar conectar
    if psql -U postgres -c "SELECT version();" &> /dev/null; then
        echo "  ${GREEN}✓${NC} Conexión exitosa"
        
        # Verificar si la base de datos existe
        if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw restaurantes_db; then
            echo "  ${GREEN}✓${NC} Base de datos 'restaurantes_db' existe"
        else
            echo "  ${YELLOW}⚠${NC}  Base de datos 'restaurantes_db' NO existe"
            echo "     Ejecuta: psql -U postgres -c \"CREATE DATABASE restaurantes_db;\""
        fi
    else
        echo "  ${RED}✗${NC} No se pudo conectar a PostgreSQL"
        echo "     Verifica que PostgreSQL esté corriendo y las credenciales sean correctas"
    fi
else
    echo "  ${RED}✗${NC} PostgreSQL no está instalado"
    echo "     Instala PostgreSQL: https://www.postgresql.org/download/"
fi

echo ""

# Verificar Redis
echo "🔴 Redis:"
if command -v redis-cli &> /dev/null; then
    REDIS_VERSION=$(redis-cli --version | head -n1)
    echo "  ${GREEN}✓${NC} Redis instalado: $REDIS_VERSION"
    
    # Intentar conectar
    if redis-cli ping &> /dev/null; then
        echo "  ${GREEN}✓${NC} Redis está corriendo"
    else
        echo "  ${YELLOW}⚠${NC}  Redis no está corriendo"
        echo "     Inicia Redis: brew services start redis (macOS) o sudo systemctl start redis-server (Linux)"
    fi
else
    echo "  ${YELLOW}⚠${NC}  Redis no está instalado (opcional pero recomendado)"
    echo "     Instala Redis: https://redis.io/download"
fi

echo ""

# Verificar archivo .env
echo "📝 Variables de entorno:"
if [ -f ".env" ]; then
    echo "  ${GREEN}✓${NC} Archivo .env existe"
    
    # Verificar variables importantes
    source .env 2>/dev/null
    
    if [ -z "$DB_HOST" ]; then
        echo "  ${RED}✗${NC} DB_HOST no está configurado"
    else
        echo "  ${GREEN}✓${NC} DB_HOST=$DB_HOST"
    fi
    
    if [ -z "$DB_DATABASE" ]; then
        echo "  ${RED}✗${NC} DB_DATABASE no está configurado"
    else
        echo "  ${GREEN}✓${NC} DB_DATABASE=$DB_DATABASE"
    fi
    
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-super-secret-jwt-key-change-this-in-production-min-32-characters" ]; then
        echo "  ${YELLOW}⚠${NC}  JWT_SECRET debe ser cambiado por seguridad"
    else
        echo "  ${GREEN}✓${NC} JWT_SECRET está configurado"
    fi
else
    echo "  ${RED}✗${NC} Archivo .env NO existe"
    echo "     Ejecuta: cp .env.example .env"
    echo "     Luego edita .env con tus credenciales"
fi

echo ""
echo "✅ Verificación completada"
echo ""
echo "📖 Para más información, consulta: SETUP_DATABASE.md"

