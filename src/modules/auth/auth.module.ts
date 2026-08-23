import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshSession } from './entities/refresh-session.entity';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([RefreshSession])
  ],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
