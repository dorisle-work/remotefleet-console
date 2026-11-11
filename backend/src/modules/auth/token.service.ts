import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { Operator, OperatorRole } from '../../entities/operator.entity';

export interface AuthTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: OperatorRole;
  exp: number;
}

@Injectable()
export class TokenService {
  private readonly secret: string;
  private readonly ttlSeconds: number;

  constructor(private readonly configService: ConfigService) {
    this.secret =
      this.configService.get<string>('JWT_SECRET') ||
      this.configService.get<string>('API_KEY') ||
      'remotefleet-dev-secret';
    this.ttlSeconds = Number(
      this.configService.get<string>('JWT_TTL_SECONDS', '86400'),
    );
  }

  sign(operator: Operator): string {
    const payload: AuthTokenPayload = {
      sub: operator.id,
      email: operator.email,
      name: operator.name,
      role: operator.role,
      exp: Math.floor(Date.now() / 1000) + this.ttlSeconds,
    };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', this.secret)
      .update(body)
      .digest('base64url');
    return `${body}.${signature}`;
  }

  verify(token: string): AuthTokenPayload {
    const [body, signature] = token.split('.');
    if (!body || !signature) {
      throw new UnauthorizedException('Invalid token');
    }

    const expected = createHmac('sha256', this.secret)
      .update(body)
      .digest('base64url');

    const left = Buffer.from(signature);
    const right = Buffer.from(expected);
    if (
      left.length !== right.length ||
      !timingSafeEqual(left, right)
    ) {
      throw new UnauthorizedException('Invalid token signature');
    }

    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as AuthTokenPayload;

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token expired');
    }

    return payload;
  }
}
