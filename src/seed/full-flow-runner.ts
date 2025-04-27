import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { FullFlowSeedService } from './full-flow.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const seedService = app.get(FullFlowSeedService);

  await seedService.run();

  await app.close();
}

bootstrap();
