import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import * as path from 'path';

dotenv.config();

// Definir el orden de las migraciones
const migrations = [
  {
    name: 'Staff Role Fields',
    script: 'migrate:staff',
    description: 'Agrega campos staffRole y restaurantId a la tabla users'
  },
  {
    name: 'Promotion Fields',
    script: 'migrate:promotion',
    description: 'Agrega campos de promoción a restaurants y campos de respuesta a reviews'
  },
  {
    name: 'Logo Field',
    script: 'migrate:logo',
    description: 'Agrega columna logo a la tabla restaurants'
  },
  {
    name: 'Unique Constraints',
    script: 'migrate:unique',
    description: 'Agrega restricciones únicas para name y email en restaurants'
  },
  {
    name: 'Max Wait Time Fields',
    script: 'migrate:max-wait-time',
    description: 'Agrega campos maxWaitTimeEnabled y maxWaitTimeMinutes a restaurants'
  },
];

async function runAllMigrations() {
  console.log('🚀 Iniciando ejecución de todas las migraciones...\n');
  console.log(`📋 Total de migraciones: ${migrations.length}\n`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ name: string; error: string }> = [];

  // Cambiar al directorio del backend
  const backendPath = path.resolve(__dirname, '../../..');
  process.chdir(backendPath);

  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    console.log(`\n${'='.repeat(70)}`);
    console.log(`[${i + 1}/${migrations.length}] Ejecutando: ${migration.name}`);
    console.log(`   Descripción: ${migration.description}`);
    console.log(`${'='.repeat(70)}`);
    
    try {
      // Ejecutar el script npm correspondiente
      execSync(`npm run ${migration.script}`, {
        stdio: 'inherit',
        cwd: backendPath,
        env: process.env
      });
      
      successCount++;
      console.log(`\n✅ ${migration.name} completada exitosamente`);
    } catch (error: any) {
      errorCount++;
      const errorMessage = error.message || String(error);
      errors.push({ name: migration.name, error: errorMessage });
      
      // Verificar si es un error que podemos ignorar (ya existe)
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      const isIgnorableError = 
        error.code === '42P07' || 
        error.code === '42703' || 
        errorMessage.includes('ya existe') ||
        output.includes('ya existe') ||
        output.includes('already exists') ||
        output.includes('IF NOT EXISTS');
      
      if (isIgnorableError) {
        console.log(`\n⚠️  ${migration.name} ya estaba aplicada (esto es normal si ya se ejecutó antes)`);
        successCount++; // Contar como éxito si es un error ignorable
        errorCount--; // No contar como error
        errors.pop(); // Remover del array de errores
      } else {
        console.error(`\n❌ Error en ${migration.name}:`, errorMessage);
        console.log(`\n⚠️  Continuando con las siguientes migraciones...`);
      }
    }
  }

  // Resumen final
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 RESUMEN DE MIGRACIONES');
  console.log(`${'='.repeat(70)}`);
  console.log(`✅ Migraciones exitosas: ${successCount}/${migrations.length}`);
  console.log(`❌ Migraciones con errores: ${errorCount}/${migrations.length}`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️  Errores encontrados:`);
    errors.forEach((err, index) => {
      console.log(`   ${index + 1}. ${err.name}: ${err.error}`);
    });
  }
  
  if (successCount === migrations.length) {
    console.log(`\n🎉 ¡Todas las migraciones se ejecutaron exitosamente!`);
  } else if (errorCount > 0 && successCount > 0) {
    console.log(`\n⚠️  Algunas migraciones tuvieron errores. Revisa los mensajes arriba.`);
  } else {
    console.log(`\n❌ Hubo problemas ejecutando las migraciones.`);
  }
}

// Ejecutar todas las migraciones
runAllMigrations()
  .then(() => {
    console.log('\n✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
