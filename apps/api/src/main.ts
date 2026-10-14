import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.enableShutdownHooks();

  // Swagger UI at /docs (JSON at /docs-json); dev only, @nestjs/swagger is a devDependency
  if (process.env.NODE_ENV !== 'production') {
    const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
    const config = new DocumentBuilder().setTitle('В Переславле API').setVersion('0.0.0').addBearerAuth().build();
    SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, config));
  }

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
