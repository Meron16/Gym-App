import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import * as Sentry from "@sentry/node";
import { AppModule } from "./app.module";

async function bootstrap() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
    });
  }

  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService);

  const corsOrigins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true,
  });

  const port = config.get<number>("port") ?? 3001;
  await app.listen(port);
}

bootstrap();
