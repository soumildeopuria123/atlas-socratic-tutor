import { Router } from 'express';
import { prisma, toJson } from '../db.js';
import { asyncHandler, HttpError, requireAuth } from './http.js';
import { getCourse } from '../atlas/curriculum.js';
import { ensureProgressRows, recalculateLocks } from '../progressService.js';

const router = Router();

function decorate(course, progressByModule, enrolled) {
  const curriculum = getCourse(course.slug);
  const layerMeta = new Map((curriculum?.layers ?? []).map((layer) => [layer.layer, layer]));

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    discipline: course.discipline,
    level: course.level,
    summary: course.summary,
    icon: curriculum?.icon ?? 'book',
    layerCount: course.modules.length,
    enrolled,
    modules: course.modules
      .sort((a, b) => a.layer - b.layer)
      .map((module) => {
        const progress = progressByModule.get(module.id);
        const meta = layerMeta.get(module.layer);
        return {
          id: module.id,
          layer: module.layer,
          title: module.title,
          tier: module.tier,
          minutes: module.minutes,
          objective: meta?.objectives?.[0] ?? null,
          status: progress?.status ?? 'LOCKED',
          bestScore: progress?.bestScore ?? null,
          attempts: progress?.attempts ?? 0,
          retestEligible: progress?.retestEligible ?? false,
          passedAt: progress?.passedAt ?? null,
        };
      }),
  };
}

async function loadForUser(userId) {
  const [courses, enrollments, progress] = await Promise.all([
    prisma.course.findMany({ include: { modules: true }, orderBy: { order: 'asc' } }),
    prisma.enrollment.findMany({ where: { userId }, select: { courseId: true } }),
    prisma.moduleProgress.findMany({ where: { userId } }),
  ]);

  const enrolledIds = new Set(enrollments.map((item) => item.courseId));
  const progressByModule = new Map(progress.map((item) => [item.moduleId, item]));

  return courses.map((course) => decorate(course, progressByModule, enrolledIds.has(course.id)));
}

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ courses: await loadForUser(req.user.id) });
  }),
);

router.get(
  '/:slug',
  requireAuth,
  asyncHandler(async (req, res) => {
    const courses = await loadForUser(req.user.id);
    const course = courses.find((item) => item.slug === req.params.slug);
    if (!course) throw new HttpError(404, 'No such course.', 'NOT_FOUND');
    res.json({ course });
  }),
);

router.post(
  '/:slug/enroll',
  requireAuth,
  asyncHandler(async (req, res) => {
    const course = await prisma.course.findUnique({ where: { slug: req.params.slug } });
    if (!course) throw new HttpError(404, 'No such course.', 'NOT_FOUND');

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId: course.id } },
    });
    if (!existing) {
      await prisma.enrollment.create({ data: { userId: req.user.id, courseId: course.id } });
    }
    await ensureProgressRows(req.user.id, course.id);
    await recalculateLocks(req.user.id, course.id);

    const courses = await loadForUser(req.user.id);
    res.status(201).json({ course: courses.find((item) => item.slug === course.slug) });
  }),
);

router.delete(
  '/:slug/enroll',
  requireAuth,
  asyncHandler(async (req, res) => {
    const course = await prisma.course.findUnique({ where: { slug: req.params.slug } });
    if (!course) throw new HttpError(404, 'No such course.', 'NOT_FOUND');

    await prisma.$transaction([
      prisma.enrollment.deleteMany({ where: { userId: req.user.id, courseId: course.id } }),
      prisma.moduleProgress.deleteMany({ where: { userId: req.user.id, courseId: course.id } }),
      prisma.quizAttempt.deleteMany({ where: { userId: req.user.id, courseId: course.id } }),
      prisma.flashcard.deleteMany({ where: { userId: req.user.id, courseId: course.id } }),
      prisma.auditLog.create({
        data: { userId: req.user.id, action: 'course:unenrolled', meta: toJson({ slug: course.slug }) },
      }),
    ]);

    res.json({ ok: true, slug: course.slug });
  }),
);

export default router;
