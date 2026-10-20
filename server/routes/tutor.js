import { Router } from 'express';
import { fromJson, prisma } from '../db.js';
import { asyncHandler, HttpError, requireAuth } from './http.js';
import { CREDIT_COSTS, spendCredits } from '../credits.js';
import { getCourse } from '../atlas/curriculum.js';
import {
  buildCourseOverview,
  buildLesson,
  buildSocraticReply,
  suggestedFollowUps,
} from '../atlas/tutor.js';
import { callEngine, engineConfigured } from '../aiEngine.js';

const router = Router();

async function loadContext(userId, courseSlug, layer) {
  const course = await prisma.course.findUnique({
    where: { slug: String(courseSlug) },
    include: { modules: true },
  });
  if (!course) throw new HttpError(404, 'No such course.', 'NOT_FOUND');

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
  });
  if (!enrollment) throw new HttpError(403, 'Enroll in the course to study it with Atlas.', 'NOT_ENROLLED');

  let dbModule;
  if (layer === undefined || layer === null || layer === '') {
    // No layer asked for: study the learner's current one (lowest not locked).
    const progressRows = await prisma.moduleProgress.findMany({
      where: { userId, courseId: course.id },
    });
    const statusByModule = new Map(progressRows.map((row) => [row.moduleId, row.status]));
    dbModule = [...course.modules]
      .sort((a, b) => a.layer - b.layer)
      .find((module) => statusByModule.get(module.id) !== 'LOCKED') ?? course.modules[0];
    if (!dbModule) throw new HttpError(404, 'No such layer.', 'NOT_FOUND');
  } else {
    dbModule = course.modules.find((module) => module.layer === Number(layer));
    if (!dbModule) throw new HttpError(404, 'No such layer.', 'NOT_FOUND');
  }

  const progress = await prisma.moduleProgress.findUnique({
    where: { userId_moduleId: { userId, moduleId: dbModule.id } },
  });

  const curriculum = getCourse(courseSlug);
  const layerContent = curriculum?.layers.find((item) => item.layer === dbModule.layer);
  if (!layerContent) throw new HttpError(500, 'Curriculum content missing.', 'CONFIG');

  return { course, dbModule, progress, curriculum, layerContent };
}

router.get(
  '/course/:slug',
  requireAuth,
  asyncHandler(async (req, res) => {
    const course = await prisma.course.findUnique({
      where: { slug: req.params.slug },
      include: { modules: true },
    });
    if (!course) throw new HttpError(404, 'No such course.', 'NOT_FOUND');

    const curriculum = getCourse(course.slug);
    const progress = await prisma.moduleProgress.findMany({
      where: { userId: req.user.id, courseId: course.id },
    });
    const byModule = new Map(progress.map((row) => [row.moduleId, row.status]));
    const progressByLayer = {};
    for (const module of course.modules) {
      progressByLayer[module.layer] = byModule.get(module.id) ?? 'LOCKED';
    }

    res.json({
      overview: buildCourseOverview(curriculum, progressByLayer),
      engine: engineConfigured() ? 'python' : 'local',
      credits: req.user.credits,
    });
  }),
);

router.post(
  '/lesson',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { courseSlug, layer, mode = 'lesson' } = req.body ?? {};
    if (!courseSlug) throw new HttpError(400, 'courseSlug is required.', 'VALIDATION');

    const { progress, curriculum, layerContent } = await loadContext(req.user.id, courseSlug, layer);

    if (progress?.status === 'LOCKED') {
      throw new HttpError(
        403,
        `Layer ${layerContent.layer} is locked. Finish Layer ${layerContent.layer - 1} first — Atlas does not skip foundations.`,
        'LAYER_LOCKED',
      );
    }

    const remediation = mode === 'remediation';
    let credits = req.user.credits;
    if (!remediation) {
      credits = await spendCredits(req.user.id, CREDIT_COSTS.LAYER_LESSON, 'layer_lesson', {
        courseSlug,
        layer: layerContent.layer,
      });
    }

    // Remediation re-teaches exactly the concepts the last variant caught out.
    let weakConcepts = [];
    if (remediation && progress) {
      const last = await prisma.quizAttempt.findFirst({
        where: { userId: req.user.id, moduleId: progress.moduleId, submittedAt: { not: null } },
        orderBy: { submittedAt: 'desc' },
      });
      const lastQuestions = fromJson(last?.questions);
      const lastAnswers = fromJson(last?.answers);
      if (Array.isArray(lastQuestions) && Array.isArray(lastAnswers)) {
        lastQuestions.forEach((question, index) => {
          if (lastAnswers[index] !== question.answer && question.concept) weakConcepts.push(question.concept);
        });
      }
    }

    const enriched = await callEngine('/lesson', {
      courseSlug,
      layer: layerContent.layer,
      mode,
    });

    let lesson;
    if (enriched?.markdown) {
      lesson = {
        markdown: enriched.markdown,
        checkpoint: enriched.checkpoint ?? layerContent.scenario,
        socraticPrompt: enriched.socraticPrompt ?? null,
        meta: {
          courseSlug,
          courseTitle: curriculum.title,
          layer: layerContent.layer,
          title: layerContent.title,
          tier: layerContent.tier,
          minutes: layerContent.minutes,
          mode,
          totalLayers: curriculum.layers.length,
          engine: 'python',
        },
      };
    } else {
      const local = buildLesson({ course: curriculum, module: layerContent, mode, weakConcepts });
      lesson = { ...local, meta: { ...local.meta, engine: 'local' } };
    }

    res.json({
      lesson,
      credits,
      cost: remediation ? 0 : CREDIT_COSTS.LAYER_LESSON,
      followUps: suggestedFollowUps(curriculum, layerContent.layer),
    });
  }),
);

router.post(
  '/message',
  requireAuth,
  asyncHandler(async (req, res) => {
    const message = String(req.body?.message ?? '').trim();
    if (!message) throw new HttpError(400, 'Say something for Atlas to work with.', 'VALIDATION');
    if (message.length > 4000) throw new HttpError(400, 'Message is too long (4000 characters max).', 'VALIDATION');

    const credits = await spendCredits(req.user.id, CREDIT_COSTS.TUTOR_MESSAGE, 'tutor_message', {
      preview: message.slice(0, 120),
    });

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.user.id },
      include: { course: true },
    });
    const progressRows = await prisma.moduleProgress.findMany({
      where: { userId: req.user.id },
    });
    const moduleToCourse = new Map();
    for (const course of await prisma.course.findMany({ include: { modules: true } })) {
      for (const module of course.modules) moduleToCourse.set(module.id, { slug: course.slug, layer: module.layer });
    }
    const progress = {};
    for (const row of progressRows) {
      const info = moduleToCourse.get(row.moduleId);
      if (!info) continue;
      progress[info.slug] ??= {};
      progress[info.slug][info.layer] = row.status;
    }

    const enriched = await callEngine('/message', {
      message,
      enrolled: enrollments.map((item) => item.course.slug),
      progress,
    });

    const reply =
      enriched?.markdown
        ? { ...enriched, meta: { ...(enriched.meta ?? {}), engine: 'python' } }
        : buildSocraticReply({
            message,
            enrolled: enrollments.map((item) => ({ course: getCourse(item.course.slug) })).filter((item) => item.course),
            progress,
          });

    const courseSlug = reply.meta?.courseSlug;
    const course = courseSlug ? getCourse(courseSlug) : null;
    const layerNumber = reply.meta?.layer ?? 1;

    res.json({
      reply,
      credits,
      engine: enriched ? 'python' : 'local',
      followUps: course ? suggestedFollowUps(course, layerNumber) : ['Teach me something foundational', 'Quiz me'],
    });
  }),
);

export default router;
