import { Router } from 'express';
import { fromJson, prisma, toJson } from '../db.js';
import { asyncHandler, HttpError, requireAuth } from './http.js';
import { CREDIT_COSTS, awardMastery, spendCredits } from '../credits.js';
import {
  PASS_THRESHOLD,
  examSecondsFor,
  getCourse,
  tierForLayer,
} from '../atlas/curriculum.js';
import { generateQuiz, gradeQuiz, sanitizeQuiz } from '../atlas/quiz.js';
import { buildRemediation } from '../atlas/tutor.js';
import { randomSeed } from '../atlas/random.js';
import { recalculateLocks } from '../progressService.js';

const router = Router();

const INTEGRITY_EVENTS = new Set([
  'fullscreen_exit',
  'visibility_hidden',
  'window_blur',
  'escape_pressed',
  'copy_attempt',
  'context_menu',
]);
const SOFT_LIMIT = 3;
const HARD_LIMIT = 5;

async function loadOwnedAttempt(userId, attemptId) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: { course: true, module: true },
  });
  if (!attempt || attempt.userId !== userId) throw new HttpError(404, 'No such attempt.', 'NOT_FOUND');
  return attempt;
}

router.post(
  '/start',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { courseSlug, layer, retest = false } = req.body ?? {};
    if (!courseSlug || !Number.isInteger(Number(layer))) {
      throw new HttpError(400, 'courseSlug and layer are required.', 'VALIDATION');
    }

    const course = await prisma.course.findUnique({
      where: { slug: String(courseSlug) },
      include: { modules: true },
    });
    if (!course) throw new HttpError(404, 'No such course.', 'NOT_FOUND');

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId: course.id } },
    });
    if (!enrollment) throw new HttpError(403, 'Enroll in the course first.', 'NOT_ENROLLED');

    const dbModule = course.modules.find((module) => module.layer === Number(layer));
    if (!dbModule) throw new HttpError(404, 'No such layer.', 'NOT_FOUND');

    const progress = await prisma.moduleProgress.findUnique({
      where: { userId_moduleId: { userId: req.user.id, moduleId: dbModule.id } },
    });
    if (!progress) throw new HttpError(409, 'Progress record missing. Re-enroll in the course.', 'NO_PROGRESS');

    if (progress.status === 'PASSED') {
      throw new HttpError(409, 'You already passed this layer.', 'ALREADY_PASSED');
    }
    if (progress.status === 'LOCKED') {
      throw new HttpError(
        403,
        `Layer ${dbModule.layer} is locked. Pass Layer ${dbModule.layer - 1} at ${Math.round(
          PASS_THRESHOLD * 100,
        )}% to unlock it.`,
        'LAYER_LOCKED',
      );
    }
    if (retest && !progress.retestEligible) {
      throw new HttpError(
        409,
        'No retest is pending for this layer. A failed attempt unlocks the retest.',
        'RETEST_NOT_ELIGIBLE',
      );
    }

    const curriculum = getCourse(course.slug);
    const layerContent = curriculum?.layers.find((item) => item.layer === dbModule.layer);
    if (!layerContent) throw new HttpError(500, 'Curriculum content missing for this layer.', 'CONFIG');

    const tier = tierForLayer(dbModule.layer);
    const cost = retest ? CREDIT_COSTS.RETEST : CREDIT_COSTS.ASSESSMENT_START;
    await spendCredits(req.user.id, cost, retest ? 'retest' : 'assessment_start', {
      courseSlug: course.slug,
      layer: dbModule.layer,
    });

    // Any earlier unsubmitted attempt for this layer is abandoned: one learner,
    // one live paper per layer, and no dangling timers in the database.
    await prisma.quizAttempt.updateMany({
      where: { userId: req.user.id, moduleId: dbModule.id, submittedAt: null },
      data: { submittedAt: new Date(), score: 0, passed: false, answers: toJson([]) },
    });

    const seed = randomSeed();
    const quiz = generateQuiz({ course: curriculum, module: layerContent, seed });
    const durationSeconds = examSecondsFor(tier);
    const startedAt = new Date();

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: req.user.id,
        courseId: course.id,
        moduleId: dbModule.id,
        difficulty: tier,
        durationSeconds,
        variantSeed: seed,
        questions: toJson(quiz.questions),
        integrityEvents: toJson([]),
        startedAt,
      },
    });

    // Retest eligibility is only cleared by a submitted attempt, so abandoning
    // a retest does not cost the learner their next variant.
    await prisma.moduleProgress.update({
      where: { id: progress.id },
      data: { status: 'IN_PROGRESS' },
    });

    const fresh = await prisma.user.findUnique({ where: { id: req.user.id }, select: { credits: true } });

    res.status(201).json({
      attempt: {
        id: attempt.id,
        courseSlug: course.slug,
        courseTitle: course.title,
        layer: dbModule.layer,
        title: dbModule.title,
        tier,
        durationSeconds,
        startedAt,
        endsAt: new Date(startedAt.getTime() + durationSeconds * 1000),
        passMark: quiz.passMark,
        totalQuestions: quiz.questions.length,
        variantSeed: seed,
        retest: Boolean(retest),
        questions: sanitizeQuiz(quiz.questions),
      },
      credits: fresh?.credits ?? req.user.credits,
      cost,
    });
  }),
);

router.get(
  '/:attemptId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const attempt = await loadOwnedAttempt(req.user.id, req.params.attemptId);
    if (attempt.submittedAt) {
      throw new HttpError(409, 'This attempt is already submitted.', 'ALREADY_SUBMITTED');
    }
    const storedQuestions = Array.isArray(fromJson(attempt.questions)) ? fromJson(attempt.questions) : [];
    res.set('Cache-Control', 'no-store');
    res.json({
      attempt: {
        id: attempt.id,
        courseSlug: attempt.course.slug,
        courseTitle: attempt.course.title,
        layer: attempt.module.layer,
        title: attempt.module.title,
        tier: attempt.difficulty,
        durationSeconds: attempt.durationSeconds,
        startedAt: attempt.startedAt,
        endsAt: new Date(new Date(attempt.startedAt).getTime() + attempt.durationSeconds * 1000),
        totalQuestions: storedQuestions.length,
        questions: sanitizeQuiz(storedQuestions),
        infractions: attempt.infractions,
      },
    });
  }),
);

router.post(
  '/:attemptId/event',
  requireAuth,
  asyncHandler(async (req, res) => {
    const type = String(req.body?.type ?? '');
    if (!INTEGRITY_EVENTS.has(type)) throw new HttpError(400, 'Unknown integrity event.', 'VALIDATION');

    const attempt = await loadOwnedAttempt(req.user.id, req.params.attemptId);
    if (attempt.submittedAt) throw new HttpError(409, 'Attempt already submitted.', 'ALREADY_SUBMITTED');

    const storedEvents = fromJson(attempt.integrityEvents);
    const events = Array.isArray(storedEvents) ? storedEvents : [];
    // Window blur alone is not evidence of cheating — it fires for devtools,
    // notifications and OS focus changes. It is logged, but only signals that
    // require the learner to leave the exam count as infractions.
    const COUNTS = new Set(['visibility_hidden', 'fullscreen_exit', 'escape_pressed', 'copy_attempt']);
    const counts = COUNTS.has(type);
    const infractions = attempt.infractions + (counts ? 1 : 0);
    const flagged = infractions >= SOFT_LIMIT;
    const terminate = infractions >= HARD_LIMIT;

    await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        infractions,
        flagged,
        integrityEvents: toJson([
          ...events.slice(-49),
          { type, at: new Date().toISOString(), infractions },
        ]),
      },
    });

    if (flagged) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'assessment:integrity_flag',
          meta: toJson({ attemptId: attempt.id, type, infractions }),
        },
      });
    }

    res.json({ infractions, flagged, terminate, remaining: Math.max(0, HARD_LIMIT - infractions) });
  }),
);

router.post(
  '/:attemptId/submit',
  requireAuth,
  asyncHandler(async (req, res) => {
    const attempt = await loadOwnedAttempt(req.user.id, req.params.attemptId);
    if (attempt.submittedAt) throw new HttpError(409, 'Attempt already submitted.', 'ALREADY_SUBMITTED');

    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
    const terminated = Boolean(req.body?.terminated);
    const storedQuestions = fromJson(attempt.questions);
    const questions = Array.isArray(storedQuestions) ? storedQuestions : [];
    const result = gradeQuiz(questions, answers);

    const elapsed = (Date.now() - new Date(attempt.startedAt).getTime()) / 1000;
    const overtime = elapsed > attempt.durationSeconds + 45;
    const passed = result.passed && !terminated;

    const progress = await prisma.moduleProgress.findUnique({
      where: { userId_moduleId: { userId: req.user.id, moduleId: attempt.moduleId } },
    });

    await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        answers: toJson(answers),
        score: result.score,
        passed,
        submittedAt: new Date(),
        flagged: attempt.flagged || overtime || terminated,
        integrityEvents: toJson([
          ...(Array.isArray(fromJson(attempt.integrityEvents)) ? fromJson(attempt.integrityEvents) : []).slice(-49),
          { type: terminated ? 'terminated' : 'submitted', at: new Date().toISOString(), elapsed },
        ]),
      },
    });

    const curriculum = getCourse(attempt.course.slug);
    const layerContent = curriculum?.layers.find((item) => item.layer === attempt.module.layer);
    let credits = req.user.credits;
    let remediation = null;

    if (passed) {
      await prisma.moduleProgress.update({
        where: { id: progress.id },
        data: {
          status: 'PASSED',
          bestScore: Math.max(progress.bestScore ?? 0, result.score),
          passedAt: progress.passedAt ?? new Date(),
          retestEligible: false,
          attempts: progress.attempts + 1,
        },
      });

      if (layerContent) {
        // Upsert per concept: SQLite has no createMany skipDuplicates.
        for (const concept of layerContent.concepts) {
          await prisma.flashcard.upsert({
            where: {
              userId_courseId_front: {
                userId: req.user.id,
                courseId: attempt.courseId,
                front: concept.term,
              },
            },
            update: { moduleId: attempt.moduleId, back: concept.definition },
            create: {
              userId: req.user.id,
              courseId: attempt.courseId,
              moduleId: attempt.moduleId,
              front: concept.term,
              back: concept.definition,
            },
          });
        }
      }

      await recalculateLocks(req.user.id, attempt.courseId);
      credits = await awardMastery(req.user.id, attempt.moduleId, result.score);

      const nextLayer = curriculum?.layers.find((item) => item.layer === attempt.module.layer + 1);
      res.json({
        result,
        passed: true,
        terminated,
        overtime,
        remediation: null,
        nextLayer: nextLayer
          ? { layer: nextLayer.layer, title: nextLayer.title, unlocked: true }
          : null,
        courseComplete: !nextLayer,
        credits,
      });
      return;
    }

    await prisma.moduleProgress.update({
      where: { id: progress.id },
      data: {
        status: 'IN_PROGRESS',
        bestScore: Math.max(progress.bestScore ?? 0, result.score),
        retestEligible: true,
        attempts: progress.attempts + 1,
      },
    });

    if (layerContent) {
      remediation = buildRemediation(
        curriculum,
        layerContent,
        result.missedConcepts,
        result.score,
      );
    }

    res.json({
      result,
      passed: false,
      terminated,
      overtime,
      remediation,
      retestAvailable: true,
      credits,
      message: terminated
        ? 'The attempt was terminated after repeated exam-integrity violations and graded as a fail.'
        : `You scored ${result.percent}%. The pass mark is ${Math.round(PASS_THRESHOLD * 100)}%. A new retest variant is now available.`,
    });
  }),
);

export default router;
