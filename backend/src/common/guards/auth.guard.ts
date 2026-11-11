import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TokenService } from '../../modules/auth/token.service';

interface AuthenticatedRequest extends Request {
  operator?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const apiKey = this.configService.get<string>('API_KEY');
    const headerKey = request.header('x-api-key');
    const bearer = request.header('authorization')?.replace(/^Bearer\s+/i, '');

    if (apiKey && headerKey && headerKey === apiKey) {
      request.operator = {
        id: '0',
        email: 'api-key@remotefleet.local',
        name: 'API Key',
        role: 'admin',
      };
      return true;
    }

    if (bearer) {
      if (apiKey && bearer === apiKey) {
        request.operator = {
          id: '0',
          email: 'api-key@remotefleet.local',
          name: 'API Key',
          role: 'admin',
        };
        return true;
      }

      try {
        const payload = this.tokenService.verify(bearer);
        request.operator = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          role: payload.role,
        };
        return true;
      } catch {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }

    if (!apiKey) {
      return true;
    }

    throw new UnauthorizedException('Invalid or missing credentials');
  }
}
