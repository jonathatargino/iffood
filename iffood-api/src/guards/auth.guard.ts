import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { jwtVerify, createRemoteJWKSet } from 'jose';

export class AuthGuard implements CanActivate {
  private remoteJWKSet: ReturnType<typeof createRemoteJWKSet>;

  constructor() {
    this.remoteJWKSet = createRemoteJWKSet(
      new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorizationToken = this.getAuthorizationToken(request);

    if (!authorizationToken) return false;

    try {
      const result = await jwtVerify(authorizationToken, this.remoteJWKSet);
      request['user'] = result.payload;
      return true;
    } catch {
      return false;
    }
  }

  private getAuthorizationToken(req: Request) {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) return null;

    const [tokenType, token] = authorizationHeader.split(' ');
    if (tokenType !== 'Bearer') return null;

    return token;
  }
}
