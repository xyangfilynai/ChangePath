import { createHmac, timingSafeEqual } from 'node:crypto';
import { prisma } from '../lib/prisma.js';

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

interface SessionPayload {
  sub: string;
  iat: number;
  exp: number;
}

function toBase64Url(value: string | Buffer): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64');
}

function getSessionSecret(): string {
  return process.env.DEV_SESSION_SECRET ?? 'changepath-dev-session-secret';
}

export function getDevAuthPassword(): string {
  return process.env.DEV_AUTH_PASSWORD ?? 'changepath-demo';
}

export function verifyDevPassword(candidate: string): boolean {
  const expected = Buffer.from(getDevAuthPassword());
  const actual = Buffer.from(candidate);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

function signPayload(payload: SessionPayload): string {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = createHmac('sha256', getSessionSecret())
    .update(encodedPayload)
    .digest();
  return `${encodedPayload}.${toBase64Url(signature)}`;
}

export function issueSessionToken(userId: string, now = new Date()) {
  const issuedAt = now.getTime();
  const expiresAt = issuedAt + THIRTY_MINUTES_MS;
  return {
    token: signPayload({
      sub: userId,
      iat: issuedAt,
      exp: expiresAt,
    }),
    expiresAt: new Date(expiresAt),
  };
}

export function extractBearerToken(
  authorizationHeader: string | undefined,
): string | null {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

export function verifySessionToken(token: string | null): SessionPayload | null {
  if (!token) return null;
  const [encodedPayload, encodedSignature] = token.split('.');
  if (!encodedPayload || !encodedSignature) return null;

  const expectedSignature = createHmac('sha256', getSessionSecret())
    .update(encodedPayload)
    .digest();
  const providedSignature = fromBase64Url(encodedSignature);

  if (expectedSignature.length !== providedSignature.length) return null;
  if (!timingSafeEqual(expectedSignature, providedSignature)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload).toString('utf8')) as SessionPayload;
    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') {
      return null;
    }
    if (payload.exp <= Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function loadAuthenticatedContext(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true },
  });

  if (!user || user.status !== 'active') {
    return null;
  }

  return {
    user,
    organization: user.organization,
  };
}
