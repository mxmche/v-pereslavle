import { timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { signJwt, verifyJwt, type JwtPayload } from './jwt';

const TOKEN_TTL_SECONDS = 12 * 3600;

const safeEqual = (a: string, b: string) => {
  const [x, y] = [Buffer.from(a), Buffer.from(b)];
  return x.length === y.length && timingSafeEqual(x, y);
};

@Injectable()
export class AuthService {
  private get secret() {
    const secret = process.env.JWT_SECRET;
    if (!secret || (secret === 'change-me' && process.env.NODE_ENV === 'production')) {
      throw new Error('JWT_SECRET must be set to a real secret in production');
    }
    return secret;
  }

  /** Single admin account from ADMIN_EMAIL / ADMIN_PASSWORD (User table comes with moderators). */
  login(email: string, password: string): { token: string; expiresIn: number } {
    const [adminEmail, adminPassword] = [process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD];
    if (!adminEmail || !adminPassword || !safeEqual(email ?? '', adminEmail) || !safeEqual(password ?? '', adminPassword)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
    return { token: signJwt({ sub: adminEmail, role: 'ADMIN', exp }, this.secret), expiresIn: TOKEN_TTL_SECONDS };
  }

  verify(token: string): JwtPayload | null {
    return verifyJwt(token, this.secret);
  }
}
