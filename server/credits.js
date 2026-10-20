import { prisma, toJson } from './db.js';
import { HttpError } from './routes/http.js';

/**
 * Credit accounting.
 *
 * Every debit is a single conditional UPDATE (credits >= amount) so concurrent
 * tutor calls or exam starts can never drive a balance negative. Every debit is
 * mirrored into AuditLog for enterprise traceability.
 */
export const CREDIT_COSTS = Object.freeze({
  SIGNUP_GRANT: 60,
  DAILY_ALLOWANCE: 5,
  TUTOR_MESSAGE: 1,
  LAYER_LESSON: 2,
  CODE_RUN: 2,
  ASSESSMENT_START: 3,
  RETEST: 4,
});

export const CREDIT_LABELS = Object.freeze({
  tutor_message: 'Atlas tutoring message',
  layer_lesson: 'Layer lesson generation',
  code_run: 'Sandbox code execution',
  assessment_start: 'Module assessment',
  retest: 'Retest variant',
  daily_allowance: 'Daily allowance',
  signup_grant: 'Welcome grant',
});

export async function spendCredits(userId, amount, action, meta = {}) {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error('Credit amount must be a positive integer');

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.user.updateMany({
      where: { id: userId, credits: { gte: amount } },
      data: { credits: { decrement: amount } },
    });
    if (result.count === 0) return null;

    await tx.auditLog.create({
      data: { userId, action: `debit:${action}`, meta: toJson({ amount, ...meta }) },
    });
    return tx.user.findUnique({ where: { id: userId }, select: { credits: true } });
  });

  if (!updated) {
    throw new HttpError(
      402,
      `This action costs ${amount} credits and your balance is too low. Pass a module or review flashcards to earn more.`,
      'INSUFFICIENT_CREDITS',
    );
  }
  return updated.credits;
}

export async function grantCredits(userId, amount, action, meta = {}) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { credits: { increment: amount } },
    select: { credits: true },
  });
  await prisma.auditLog.create({
    data: { userId, action: `credit:${action}`, meta: toJson({ amount, ...meta }) },
  });
  return updated.credits;
}

/**
 * Passing a module is the platform's earned-credit path: it refunds the exam
 * cost and rewards mastery so learners are never permanently locked out.
 */
export async function awardMastery(userId, moduleId, score) {
  return grantCredits(userId, 8, 'mastery_reward', { moduleId, score });
}
