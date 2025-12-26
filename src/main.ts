import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  
  // Enable CORS
  const frontendUrl = configService.get('FRONTEND_URL') || 'http://localhost:3001';
  app.enableCors({
    origin: [
      frontendUrl,
      'http://localhost:3000',
      'http://localhost:3001',
      /^http:\/\/192\.168\.\d+\.\d+:3000$/, // Permitir cualquier IP local en puerto 3000
      /^http:\/\/192\.168\.\d+\.\d+:3001$/, // Permitir cualquier IP local en puerto 3001
    ],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  const port = configService.get('PORT') || 3000;
  const host = '0.0.0.0'; // Escuchar en todas las interfaces de red
  await app.listen(port, host);
  
  console.log(`🚀 Backend running on: http://localhost:${port}/api`);
  console.log(`🌐 Accessible from network at: http://[YOUR_IP]:${port}/api`);
  console.log(`📝 Para acceso desde otra computadora, configura NEXT_PUBLIC_API_URL=http://[YOUR_IP]:${port}/api en el frontend`);
  console.log(`🔌 WebSocket server available at: http://[YOUR_IP]:${port} (automatically uses same URL as API)`);
}

bootstrap();

