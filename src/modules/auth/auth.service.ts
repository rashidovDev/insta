import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import * as argon2 from 'argon2';
import { createHash, randomUUID } from 'crypto';

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

      private readonly dataSource: DataSource,
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

    const familyId = randomUUID();

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
      familyId,
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

async refresh(refreshToken: string) {
  let payload: {
    sub: number;
    email: string;
  };

  try {
    payload = await this.jwtService.verifyAsync(
      refreshToken,
      {
        secret:
          this.configService.getOrThrow<string>(
            'JWT_REFRESH_SECRET',
          ),
      },
    );
  } catch {
    throw new UnauthorizedException(
      'Invalid refresh token',
    );
  }

  const tokenHash = createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  const session =
    await this.refreshSessionRepository.findOne({
      where: {
        tokenHash,
      },
      relations: {
        user: true,
      },
    });

  if (!session) {
    throw new UnauthorizedException(
      'Invalid refresh token',
    );
  }

if (session.revokedAt) {
  await this.refreshSessionRepository.update(
    {
      familyId: session.familyId,
      revokedAt: IsNull(),
    },
    {
      revokedAt: new Date(),
    },
  );

  throw new UnauthorizedException(
    'Refresh token reuse detected',
  );
}

  if (session.expiresAt < new Date()) {
    throw new UnauthorizedException(
      'Refresh token has expired',
    );
  }

  const user = session.user;

  const newPayload = {
    sub: user.id,
    email: user.email,
  };

  const newAccessToken =
    await this.jwtService.signAsync(
      newPayload,
      {
        secret:
          this.configService.getOrThrow<string>(
            'JWT_ACCESS_SECRET',
          ),
        expiresIn: '15m',
      },
    );

  const newRefreshToken =
    await this.jwtService.signAsync(
      newPayload,
      {
        secret:
          this.configService.getOrThrow<string>(
            'JWT_REFRESH_SECRET',
          ),
        expiresIn: '7d',
      },
    );

  const newTokenHash = createHash('sha256')
    .update(newRefreshToken)
    .digest('hex');

  await this.dataSource.transaction(
    async (manager) => {
      session.revokedAt = new Date();

      await manager.save(session);

      await manager.save(
        RefreshSession,
        {
          user,
             familyId: session.familyId,
          tokenHash: newTokenHash,
          expiresAt: new Date(
            Date.now() +
              7 * 24 * 60 * 60 * 1000,
          ),
          revokedAt: null,
        },
      );
    },
  );

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

async logout(refreshToken: string) {
  const tokenHash = createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  const session =
    await this.refreshSessionRepository.findOne({
      where: {
        tokenHash,
      },
    });

  if (!session) {
    return;
  }

  if (!session.revokedAt) {
    session.revokedAt = new Date();

    await this.refreshSessionRepository.save(session);
  }
}
}