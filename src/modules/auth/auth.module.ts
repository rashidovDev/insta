import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshSession } from './entities/refresh-session.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([RefreshSession, User])
  ],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
