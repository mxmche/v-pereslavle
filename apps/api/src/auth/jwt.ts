import { createHmac, timingSafeEqual } from 'node:crypto';

export interface JwtPayload {
  sub: string;
  role: 'ADMIN' | 'MODERATOR';
  exp: number; // seconds since epoch
}

const b64 = (data: string | Buffer) => Buffer.from(data).toString('base64url');
const sign = (input: string, secret: string) => createHmac('sha256', secret).update(input).digest();

/** Minimal HS256 JWT — enough for the single-tenant admin session. */
export function signJwt(payload: JwtPayload, secret: string): string {
  const head = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64(JSON.stringify(payload));
  return `${head}.${body}.${b64(sign(`${head}.${body}`, secret))}`;
}

export function verifyJwt(token: string, secret: string, now = Date.now()): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const expected = sign(`${parts[0]}.${parts[1]}`, secret);
  const actual = Buffer.from(parts[2], 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as JwtPayload;
    return payload.exp * 1000 > now ? payload : null;
  } catch {
    return null;
  }
}
