import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';

import type { Request, Response } from 'express';

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

  @Post('refresh')
async refresh(
  @Req() request: Request,
  @Res({ passthrough: true })
  response: Response,
) {
  const refreshToken =
    request.cookies?.refresh_token;

  if (!refreshToken) {
    throw new UnauthorizedException(
      'Refresh token not found',
    );
  }

  const result =
    await this.authService.refresh(
      refreshToken,
    );

  response.cookie(
    'refresh_token',
    result.refreshToken,
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
    accessToken: result.accessToken,
  };
}

@Post('logout')
async logout(
  @Req() request: Request,
  @Res({ passthrough: true })
  response: Response,
) {
  const refreshToken =
    request.cookies?.refresh_token;

  if (refreshToken) {
    await this.authService.logout(
      refreshToken,
    );
  }

  response.clearCookie(
    'refresh_token',
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV === 'production',

      sameSite: 'lax',
    },
  );

  return {
    message: 'Logged out successfully',
  };
}
}