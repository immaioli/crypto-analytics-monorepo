import { Module } from '@nestjs/common';
import { CryptoModule } from './crypto/crypto.module.js';

@Module({
  imports: [CryptoModule],
})
export class AppModule {}
