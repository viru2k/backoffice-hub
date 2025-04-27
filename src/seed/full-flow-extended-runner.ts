import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { FullFlowExtendedSeedService } from './full-flow-extended.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const seeder = app.get(FullFlowExtendedSeedService);

  await seeder.run();

  await app.close();
}

bootstrap();
