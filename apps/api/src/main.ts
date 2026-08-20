import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

function resolveAllowedOrigins(): string[] | true {
  const rawOrigins = process.env.CORS_ORIGIN;
  if (!rawOrigins) {
    // Local/dev fallback. Production MUST set CORS_ORIGIN to the Vercel URL.
    return true;
  }

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = resolveAllowedOrigins();

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`API listening on port ${port}`);
}

bootstrap();
