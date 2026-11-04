import { Router } from 'express';
import { prisma, toJson } from '../db.js';
import { asyncHandler, HttpError, requireAuth } from './http.js';
import { getCourse } from '../atlas/curriculum.js';

const router = Router();

/**
 * SM-2 scheduler.
 *   quality < 3  -> lapse: repetitions reset, interval 1 day, ease down 0.2
 *   quality >= 3 -> interval 1, then 6, then round(interval * ease)
 * Ease is clamped at 1.3 so a repeatedly failed card still resurfaces weekly.
 */
export function scheduleReview(card, quality, now = new Date()) {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  let { easeFactor, interval, repetitions, lapses } = card;

  if (q < 3) {
    repetitions = 0;
    interval = 1;
    lapses += 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    easeFactor = Math.max(
      1.3,
      easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
    );
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }

  const dueAt = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
  return { easeFactor, interval, repetitions, lapses, dueAt, lastReviewedAt: now, quality: q };
}

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const now = new Date();
    const [due, upcoming, total, mastered] = await Promise.all([
      prisma.flashcard.findMany({
        where: { userId: req.user.id, dueAt: { lte: now } },
        include: { course: true, module: true },
        orderBy: { dueAt: 'asc' },
        take: 25,
      }),
      prisma.flashcard.count({
        where: { userId: req.user.id, dueAt: { gt: now } },
      }),
      prisma.flashcard.count({ where: { userId: req.user.id } }),
      prisma.flashcard.count({ where: { userId: req.user.id, repetitions: { gte: 3 } } }),
    ]);

    res.set('Cache-Control', 'no-store');
    res.json({
      due: due.map((card) => ({
        id: card.id,
        front: card.front,
        back: card.back,
        easeFactor: card.easeFactor,
        interval: card.interval,
        repetitions: card.repetitions,
        lapses: card.lapses,
        dueAt: card.dueAt,
        courseSlug: card.course.slug,
        courseTitle: card.course.title,
        layer: card.module?.layer ?? null,
        layerTitle: card.module?.title ?? null,
      })),
      stats: { due: due.length, upcoming, total, mastered },
    });
  }),
);

router.post(
  '/:cardId/review',
  requireAuth,
  asyncHandler(async (req, res) => {
    const quality = Number(req.body?.quality);
    if (!Number.isInteger(quality) || quality < 0 || quality > 5) {
      throw new HttpError(400, 'quality must be an integer 0–5.', 'VALIDATION');
    }

    const card = await prisma.flashcard.findUnique({ where: { id: req.params.cardId } });
    if (!card || card.userId !== req.user.id) throw new HttpError(404, 'No such card.', 'NOT_FOUND');

    const next = scheduleReview(card, quality);
    const updated = await prisma.flashcard.update({
      where: { id: card.id },
      data: {
        easeFactor: next.easeFactor,
        interval: next.interval,
        repetitions: next.repetitions,
        lapses: next.lapses,
        dueAt: next.dueAt,
        lastReviewedAt: next.lastReviewedAt,
      },
    });

    // Reviewing is a credit-earning path, capped at 5 per day so it cannot be farmed.
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const earnedToday = await prisma.auditLog.count({
      where: { userId: req.user.id, action: 'credit:srs_review', createdAt: { gte: dayStart } },
    });
    let creditsEarned = 0;
    let credits = req.user.credits;
    if (earnedToday < 5) {
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { credits: { increment: 1 } },
      });
      await prisma.auditLog.create({
        data: { userId: req.user.id, action: 'credit:srs_review', meta: toJson({ cardId: card.id }) },
      });
      credits = user.credits;
      creditsEarned = 1;
    }

    res.json({
      card: {
        id: updated.id,
        dueAt: updated.dueAt,
        interval: updated.interval,
        easeFactor: updated.easeFactor,
        repetitions: updated.repetitions,
      },
      credits,
      creditsEarned,
      quality,
    });
  }),
);

/** Manual deck seeding for a course the learner has already started. */
router.post(
  '/seed/:slug',
  requireAuth,
  asyncHandler(async (req, res) => {
    const course = await prisma.course.findUnique({
      where: { slug: req.params.slug },
      include: { modules: true },
    });
    if (!course) throw new HttpError(404, 'No such course.', 'NOT_FOUND');

    const curriculum = getCourse(course.slug);
    if (!curriculum) throw new HttpError(404, 'Course content unavailable.', 'NOT_FOUND');

    const passed = await prisma.moduleProgress.findMany({
      where: { userId: req.user.id, courseId: course.id, status: 'PASSED' },
    });
    if (!passed.length) {
      throw new HttpError(409, 'Pass at least one layer before building a deck.', 'NO_PASSED_LAYERS');
    }

    const passedModuleIds = new Set(passed.map((row) => row.moduleId));
    const rows = [];
    for (const module of course.modules) {
      if (!passedModuleIds.has(module.id)) continue;
      const layer = curriculum.layers.find((item) => item.layer === module.layer);
      if (!layer) continue;
      for (const concept of layer.concepts) {
        rows.push({
          userId: req.user.id,
          courseId: course.id,
          moduleId: module.id,
          front: concept.term,
          back: concept.definition,
        });
      }
    }

    let created = 0;
    for (const row of rows) {
      const existing = await prisma.flashcard.findUnique({
        where: {
          userId_courseId_front: {
            userId: row.userId,
            courseId: row.courseId,
            front: row.front,
          },
        },
      });
      if (existing) continue;
      await prisma.flashcard.create({ data: row });
      created += 1;
    }
    res.status(201).json({ created, total: rows.length });
  }),
);

export default router;
