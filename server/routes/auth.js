import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma, toJson } from '../db.js';
import {
  HttpError,
  asyncHandler,
  clearSessionCookie,
  publicUser,
  requireAuth,
  setSessionCookie,
} from './http.js';
import { CREDIT_COSTS } from '../credits.js';

const router = Router();
const BCRYPT_ROUNDS = 12;

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;
const MIN_PASSWORD = 8;

function validateCredentials(username, password, { requireStrong = true } = {}) {
  if (typeof username !== 'string' || typeof password !== 'string') {
    throw new HttpError(400, 'Username and password are required.', 'VALIDATION');
  }
  const trimmed = username.trim();
  if (!USERNAME_RE.test(trimmed)) {
    throw new HttpError(
      400,
      'Username must be 3–24 characters: letters, numbers, or underscores.',
      'VALIDATION',
    );
  }
  if (requireStrong) {
    if (password.length < MIN_PASSWORD) {
      throw new HttpError(400, `Password must be at least ${MIN_PASSWORD} characters.`, 'VALIDATION');
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      throw new HttpError(400, 'Password must contain at least one letter and one number.', 'VALIDATION');
    }
  }
  return trimmed;
}

router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body ?? {};
    const clean = validateCredentials(username, password);

    const existing = await prisma.user.findUnique({ where: { username: clean } });
    if (existing) throw new HttpError(409, 'That username is already taken.', 'USERNAME_TAKEN');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: { username: clean, passwordHash, credits: CREDIT_COSTS.SIGNUP_GRANT },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'credit:signup_grant',
        meta: toJson({ amount: CREDIT_COSTS.SIGNUP_GRANT }),
      },
    });

    setSessionCookie(res, user);
    res.status(201).json({ user: publicUser(user), creditsGranted: CREDIT_COSTS.SIGNUP_GRANT });
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body ?? {};
    const clean = validateCredentials(username, password, { requireStrong: false });

    const user = await prisma.user.findUnique({ where: { username: clean } });
    // Same error for unknown user and wrong password: no account enumeration.
    const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!ok) throw new HttpError(401, 'Incorrect username or password.', 'INVALID_CREDENTIALS');

    await prisma.auditLog.create({ data: { userId: user.id, action: 'auth:login', meta: toJson({}) } });
    setSessionCookie(res, user);
    res.json({ user: publicUser(user) });
  }),
);

router.post(
  '/logout',
  asyncHandler(async (_req, res) => {
    clearSessionCookie(res);
    res.json({ ok: true });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const enrollments = await prisma.enrollment.count({ where: { userId: req.user.id } });
    const passed = await prisma.moduleProgress.count({
      where: { userId: req.user.id, status: 'PASSED' },
    });
    res.json({ user: publicUser(req.user), stats: { enrollments, passedModules: passed } });
  }),
);

router.post(
  '/allowance',
  requireAuth,
  asyncHandler(async (req, res) => {
    // One small daily top-up so a learner who runs dry can keep studying.
    const since = new Date(Date.now() - 20 * 60 * 60 * 1000);
    const recent = await prisma.auditLog.findFirst({
      where: { userId: req.user.id, action: 'credit:daily_allowance', createdAt: { gte: since } },
    });
    if (recent) {
      throw new HttpError(429, 'Your daily allowance is already claimed. Try again tomorrow.', 'ALLOWANCE_CLAIMED');
    }
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { credits: { increment: CREDIT_COSTS.DAILY_ALLOWANCE } },
    });
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'credit:daily_allowance',
        meta: toJson({ amount: CREDIT_COSTS.DAILY_ALLOWANCE }),
      },
    });
    res.json({ user: publicUser(user), granted: CREDIT_COSTS.DAILY_ALLOWANCE });
  }),
);

export default router;
