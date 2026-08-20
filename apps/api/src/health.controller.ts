import { Controller, Get, Head } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/health')
  @Head('/health')
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
