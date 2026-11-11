import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller('api/v1/health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'remotefleet-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
