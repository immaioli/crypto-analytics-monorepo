import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CryptoModule } from './crypto/crypto.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CryptoModule
  ],
  controllers: [HealthController],
})
export class AppModule {}
