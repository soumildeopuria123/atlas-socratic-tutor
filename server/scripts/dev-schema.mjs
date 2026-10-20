/**
 * Local development bridge.
 *
 * The deployable schema is PostgreSQL. Developers who do not want to run
 * Postgres can generate a SQLite twin with identical models:
 *
 *   node scripts/dev-schema.mjs
 *   npx prisma db push --schema prisma/schema.dev.prisma
 *
 * Only the datasource block changes, so the generated client has the same shape
 * and the application code is oblivious to the provider.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(here, '..', 'prisma', 'schema.prisma');
const target = path.join(here, '..', 'prisma', 'schema.dev.prisma');

const schema = await readFile(source, 'utf8');
const devSchema = schema
  .replace('provider = "postgresql"', 'provider = "sqlite"')
  // SQLite has no native JSON column in Prisma: those columns become TEXT and
  // server/db.js serialises through toJson/fromJson automatically.
  .replace(/\bJson\b/g, 'String')
  .replace(
    '// Atlas — Prisma schema (PostgreSQL)',
    '// Atlas — generated SQLite twin for local development. Do not edit by hand.\n// JSON columns are stored as TEXT (see server/db.js toJson/fromJson).\n// Regenerate with `node scripts/dev-schema.mjs` after changing schema.prisma.',
  );

await writeFile(target, devSchema, 'utf8');
console.log(`[schema] wrote ${path.relative(process.cwd(), target)} (sqlite provider)`);
