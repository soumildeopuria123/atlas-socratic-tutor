import { Router } from 'express';
import { prisma } from '../db.js';
import { asyncHandler, HttpError, publicUser, requireAuth } from './http.js';
import { getCourse } from '../atlas/curriculum.js';
import { deleteModuleProgress, recalculateLocks, resetAllProgress } from '../progressService.js';

const router = Router();

async function buildDashboard(user) {
  const [enrollments, progress, dueCards, attempts, passedCount] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId: user.id },
      include: { course: { include: { modules: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.moduleProgress.findMany({ where: { userId: user.id } }),
    prisma.flashcard.count({ where: { userId: user.id, dueAt: { lte: new Date() } } }),
    prisma.quizAttempt.findMany({
      where: { userId: user.id, submittedAt: { not: null } },
      include: { course: true, module: true },
      orderBy: { submittedAt: 'desc' },
      take: 8,
    }),
    prisma.moduleProgress.count({ where: { userId: user.id, status: 'PASSED' } }),
  ]);

  const progressByModule = new Map(progress.map((item) => [item.moduleId, item]));

  const courses = enrollments.map(({ course }) => {
    const curriculum = getCourse(course.slug);
    const layerMeta = new Map((curriculum?.layers ?? []).map((layer) => [layer.layer, layer]));
    const modules = course.modules
      .sort((a, b) => a.layer - b.layer)
      .map((module) => {
        const row = progressByModule.get(module.id);
        return {
          id: module.id,
          layer: module.layer,
          title: module.title,
          tier: module.tier,
          minutes: module.minutes,
          objective: layerMeta.get(module.layer)?.objectives?.[0] ?? null,
          status: row?.status ?? 'LOCKED',
          bestScore: row?.bestScore ?? null,
          attempts: row?.attempts ?? 0,
          retestEligible: row?.retestEligible ?? false,
          passedAt: row?.passedAt ?? null,
        };
      });

    const passedLayers = modules.filter((module) => module.status === 'PASSED').length;
    const scores = modules.filter((module) => typeof module.bestScore === 'number').map((m) => m.bestScore);
    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      discipline: course.discipline,
      level: course.level,
      summary: course.summary,
      icon: curriculum?.icon ?? 'book',
      layerCount: modules.length,
      enrolled: true,
      completed: passedLayers === modules.length && modules.length > 0,
      passedLayers,
      averageScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
      modules,
    };
  });

  const totalModules = courses.reduce((sum, course) => sum + course.layerCount, 0);
  const retests = courses.reduce(
    (sum, course) => sum + course.modules.filter((module) => module.retestEligible).length,
    0,
  );
  const allScores = courses.flatMap((course) =>
    course.modules.map((module) => module.bestScore).filter((score) => typeof score === 'number'),
  );

  return {
    user: publicUser(user),
    credits: user.credits,
    stats: {
      enrollments: courses.length,
      passedModules: passedCount,
      totalModules,
      averageScore: allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : null,
      dueCards,
      activeRetests: retests,
    },
    courses,
    recentAttempts: attempts.map((attempt) => ({
      id: attempt.id,
      courseSlug: attempt.course.slug,
      courseTitle: attempt.course.title,
      layer: attempt.module.layer,
      title: attempt.module.title,
      percent: Math.round((attempt.score ?? 0) * 100),
      passed: attempt.passed,
      flagged: attempt.flagged,
      submittedAt: attempt.submittedAt,
    })),
  };
}

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(await buildDashboard(req.user));
  }),
);

router.delete(
  '/module/:moduleId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const module = await prisma.module.findUnique({ where: { id: req.params.moduleId } });
    if (!module) throw new HttpError(404, 'No such module.', 'NOT_FOUND');

    const owns = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId: module.courseId } },
    });
    if (!owns) throw new HttpError(403, 'You are not enrolled in that course.', 'FORBIDDEN');

    await deleteModuleProgress(req.user.id, module.id);
    res.json(await buildDashboard(req.user));
  }),
);

router.post(
  '/reset',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { confirm } = req.body ?? {};
    if (confirm !== 'RESET') {
      throw new HttpError(400, 'Send { "confirm": "RESET" } to wipe all progress.', 'CONFIRM_REQUIRED');
    }
    await resetAllProgress(req.user.id);
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.user.id },
      select: { courseId: true },
    });
    for (const enrollment of enrollments) {
      await recalculateLocks(req.user.id, enrollment.courseId);
    }
    res.json(await buildDashboard(req.user));
  }),
);

export default router;
