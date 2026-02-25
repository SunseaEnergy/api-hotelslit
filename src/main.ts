import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global interceptor (wraps responses)
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Hotelslit API')
    .setDescription(
      'REST API for Hotelslit - Hotel/Apartment booking platform for users and vendors',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'User and Vendor authentication')
    .addTag('Users', 'User profile management')
    .addTag('Vendors', 'Vendor profile and dashboard')
    .addTag('Properties', 'Public property browsing')
    .addTag('Vendor Properties', 'Vendor property management')
    .addTag('Rooms', 'Public room browsing')
    .addTag('Vendor Rooms', 'Vendor room management')
    .addTag('Bookings', 'User booking management')
    .addTag('Vendor Bookings', 'Vendor booking management')
    .addTag('Categories', 'Property categories')
    .addTag('Amenities', 'Property amenities')
    .addTag('Favorites', 'User favorites')
    .addTag('Reviews', 'Property reviews')
    .addTag('Payments', 'Payment processing')
    .addTag('Wallet', 'User wallet')
    .addTag('Promo Codes', 'Promotional codes')
    .addTag('Addresses', 'User addresses')
    .addTag('Upload', 'File uploads')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Hotelslit API running on http://localhost:${port}`);
  console.log(
    `📚 Swagger docs available at http://localhost:${port}/api/docs`,
  );
}
bootstrap();
