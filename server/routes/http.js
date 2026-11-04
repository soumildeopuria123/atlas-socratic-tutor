/**
 * HTTP + session primitives shared by every route.
 *
 * Sessions are stateless JWTs in an httpOnly cookie. Because the Next.js client
 * proxies /api through its own origin, the browser never exposes the token to
 * JavaScript and the middleware can gate protected pages by cookie presence.
 */
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

export const COOKIE_NAME = 'atlas_token';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
const BCRYPT_ROUNDS = 12;

export class HttpError extends Error {
  constructor(status, message, code = undefined, details = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new HttpError(500, 'Server is missing a JWT_SECRET (min 16 characters).', 'CONFIG');
  }
  return secret;
}

export function signSession(user) {
  return jwt.sign({ sub: user.id, username: user.username }, jwtSecret(), {
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

export function setSessionCookie(res, user) {
  res.cookie(COOKIE_NAME, signSession(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: TOKEN_TTL_SECONDS * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/', sameSite: 'lax' });
}

export function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    credits: user.credits,
    createdAt: user.createdAt,
  };
}

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw new HttpError(401, 'Sign in to continue.', 'UNAUTHENTICATED');

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret());
  } catch {
    throw new HttpError(401, 'Your session expired. Sign in again.', 'SESSION_EXPIRED');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new HttpError(401, 'Account no longer exists.', 'UNAUTHENTICATED');

  req.user = user;
  next();
});

// Reused by the login route to verify credentials without leaking which half failed.
export async function verifyPassword(plain, hash, bcrypt) {
  return bcrypt.compare(plain, hash);
}
