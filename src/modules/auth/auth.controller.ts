import { Controller } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
constructor(
    
    private readonly jwtService : JwtService
){}
}
