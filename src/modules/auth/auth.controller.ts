import {
  Body,
  Controller,
  Post,
  Res,
} from '@nestjs/common';

import type { Response } from 'express';

import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  register(
    @Body() dto: RegisterDto,
  ) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true })
    response: Response,
  ) {
    const user =
      await this.authService.validateUser(
        dto.email,
        dto.password,
      );

    const {
      accessToken,
      refreshToken,
    } = await this.authService.login(user);

    response.cookie(
      'refresh_token',
      refreshToken,
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV === 'production',

        sameSite: 'lax',

        maxAge:
          7 * 24 * 60 * 60 * 1000,
      },
    );

    return {
      accessToken,
    };
  }
}