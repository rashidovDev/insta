import { Injectable } from '@nestjs/common';
import { RefreshSession } from './entities/refresh-session.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
     constructor(
    @InjectRepository(RefreshSession)
    private readonly refreshSessionRepository: Repository<RefreshSession>,
    private readonly jwtService : JwtService,
    private readonly configService : ConfigService
  ) {}

  async register(user : User){
    
  }

  async login(user: User) {
  const payload = {
    sub: user.id,
    email: user.email,
  };

  const accessToken = await this.jwtService.signAsync(payload, {
    secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    expiresIn: '15m',
  });

  const refreshToken = await this.jwtService.signAsync(payload, {
    secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    expiresIn: '7d',
  });

  return {
    accessToken,
    refreshToken,
  };
}
}
