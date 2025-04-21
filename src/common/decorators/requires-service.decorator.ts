import { SetMetadata } from '@nestjs/common';

export const RequiresService = (service: string) => SetMetadata('service', service);
