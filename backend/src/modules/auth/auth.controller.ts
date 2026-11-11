import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

interface AuthenticatedRequest extends Request {
  operator?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    if (!req.operator) {
      throw new UnauthorizedException('Unauthenticated');
    }
    if (req.operator.id === '0') {
      return req.operator;
    }
    return this.authService.me(req.operator.id);
  }
}
