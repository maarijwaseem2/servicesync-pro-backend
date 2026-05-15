import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const rawFrontendUrl = process.env.FRONTEND_URL || '';
  const allowedOrigins = rawFrontendUrl
    ? rawFrontendUrl.split(',').map((u) => u.trim().replace(/\/$/, ''))
    : [];

  app.enableCors({
    // If FRONTEND_URL is set → only those origins; otherwise reflect all (dev mode)
    origin: allowedOrigins.length
      ? (origin, callback) => {
          if (!origin) return callback(null, true);
          const normalised = origin.replace(/\/$/, '');
          callback(null, allowedOrigins.includes(normalised));
        }
      : true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const uploadsDir = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();