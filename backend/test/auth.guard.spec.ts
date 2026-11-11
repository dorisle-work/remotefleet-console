import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '../src/common/guards/auth.guard';
import { TokenService } from '../src/modules/auth/token.service';
import { Operator, OperatorRole } from '../src/entities/operator.entity';

function createGuard(
  apiKey: string | undefined,
  isPublic = false,
): { guard: AuthGuard; tokenService: TokenService } {
  const store: Record<string, string | undefined> = {
    API_KEY: apiKey,
    JWT_SECRET: 'test-secret',
    JWT_TTL_SECONDS: '3600',
  };
  const config = {
    get: jest.fn((key: string, fallback?: string) => store[key] ?? fallback),
  } as unknown as ConfigService;
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(isPublic),
  } as unknown as Reflector;
  const tokenService = new TokenService(config);
  return {
    guard: new AuthGuard(config, reflector, tokenService),
    tokenService,
  };
}

function mockContext(headers: Record<string, string | undefined>) {
  const request: {
    header: (name: string) => string | undefined;
    operator?: unknown;
  } = {
    header: (name: string) => {
      const key = name.toLowerCase();
      if (key === 'x-api-key') return headers['x-api-key'];
      if (key === 'authorization') return headers.authorization;
      return undefined;
    },
  };
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    request,
  };
}

describe('AuthGuard', () => {
  it('allows public routes', () => {
    const { guard } = createGuard('secret', true);
    expect(guard.canActivate(mockContext({}) as never)).toBe(true);
  });

  it('allows all traffic when API_KEY is empty and no bearer', () => {
    const { guard } = createGuard('');
    expect(guard.canActivate(mockContext({}) as never)).toBe(true);
  });

  it('accepts valid x-api-key', () => {
    const { guard } = createGuard('secret');
    expect(
      guard.canActivate(mockContext({ 'x-api-key': 'secret' }) as never),
    ).toBe(true);
  });

  it('accepts signed operator token', () => {
    const { guard, tokenService } = createGuard('secret');
    const operator = {
      id: '9',
      email: 'ops@remotefleet.test',
      name: 'Ops',
      role: OperatorRole.OPERATOR,
    } as Operator;
    const token = tokenService.sign(operator);
    expect(
      guard.canActivate(
        mockContext({ authorization: `Bearer ${token}` }) as never,
      ),
    ).toBe(true);
  });

  it('rejects missing/invalid credentials', () => {
    const { guard } = createGuard('secret');
    expect(() => guard.canActivate(mockContext({}) as never)).toThrow(
      UnauthorizedException,
    );
  });
});
