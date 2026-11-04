import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

/**
 * One Prisma client per process. Cached on globalThis so `node --watch`
 * restarts in development do not exhaust the PostgreSQL connection pool.
 */
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__atlasPrisma ??
  new PrismaClient({
    log: process.env.PRISMA_LOG === 'true' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.__atlasPrisma = prisma;

/**
 * SQLite (the zero-install dev provider) has no JSON column type in Prisma, so
 * the generated dev schema stores those columns as TEXT. These helpers make the
 * difference invisible to route code: on PostgreSQL they pass values through
 * untouched, on SQLite they serialise on write and parse on read.
 */
export const JSON_AS_TEXT = (process.env.DATABASE_URL ?? '').startsWith('file:');

export function toJson(value) {
  if (!JSON_AS_TEXT || value === undefined) return value;
  return value === null ? null : JSON.stringify(value);
}

export function fromJson(value) {
  if (!JSON_AS_TEXT || typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export default prisma;
