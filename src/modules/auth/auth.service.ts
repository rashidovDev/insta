import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import * as argon2 from 'argon2';
import { createHash } from 'crypto';

import { User } from '../users/entities/user.entity';
import { RefreshSession } from './entities/refresh-session.entity';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(RefreshSession)
    private readonly refreshSessionRepository: Repository<RefreshSession>,

    private readonly jwtService: JwtService,

    private readonly configService: ConfigService,
  ) {}

  //REGISTER USER
  async register(dto: RegisterDto) {
    const existingUser =
      await this.userRepository.findOne({
        where: {
          email: dto.email,
        },
      });

    if (existingUser) {
      throw new ConflictException(
        'Email already exists',
      );
    }

    const passwordHash =
      await argon2.hash(dto.password);

    const user =
      this.userRepository.create({
        name: dto.name,
        email: dto.email,
        passwordHash,
      });

    const savedUser =
      await this.userRepository.save(user);

    return {
      id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
    };
  }

  //LOGIN
  async login(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken =
      await this.jwtService.signAsync(payload, {
        secret:
          this.configService.getOrThrow<string>(
            'JWT_ACCESS_SECRET',
          ),
        expiresIn: '15m',
      });

    const refreshToken =
      await this.jwtService.signAsync(payload, {
        secret:
          this.configService.getOrThrow<string>(
            'JWT_REFRESH_SECRET',
          ),
        expiresIn: '7d',
      });

    const tokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await this.refreshSessionRepository.save({
      user,
      tokenHash,
      expiresAt: new Date(
        Date.now() +
          7 * 24 * 60 * 60 * 1000,
      ),
      revokedAt: null,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  //VALIDATE USER
  async validateUser(email: string, password: string) {
  const user = await this.userRepository.findOne({
    where: { email },
  });

  if (!user) {
    throw new UnauthorizedException(
      'Invalid email or password',
    );
  }

  const passwordValid = await argon2.verify(
    user.passwordHash,
    password,
  );

  if (!passwordValid) {
    throw new UnauthorizedException(
      'Invalid email or password',
    );
  }

  return user;
}
}