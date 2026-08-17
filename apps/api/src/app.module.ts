import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CryptoModule } from './crypto/crypto.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CryptoModule
  ],
})
export class AppModule {}
