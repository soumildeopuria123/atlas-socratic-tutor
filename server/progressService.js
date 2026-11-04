import { prisma, toJson } from './db.js';

/**
 * Progress rows are created when a learner enrolls, and locks are recomputed
 * from scratch whenever progress is edited. Deriving state instead of patching
 * it prevents the classic bug where deleting a module leaves advanced layers
 * open behind a broken prerequisite chain.
 */
export async function ensureProgressRows(userId, courseId) {
  const modules = await prisma.module.findMany({
    where: { courseId },
    orderBy: { layer: 'asc' },
    select: { id: true, layer: true },
  });
  if (!modules.length) return [];

  // Loop upserts instead of createMany({ skipDuplicates }): SQLite does not
  // support that flag, and this path stays identical on PostgreSQL.
  for (const module of modules) {
    await prisma.moduleProgress.upsert({
      where: { userId_moduleId: { userId, moduleId: module.id } },
      update: {},
      create: {
        userId,
        courseId,
        moduleId: module.id,
        status: module.layer === 1 ? 'UNLOCKED' : 'LOCKED',
      },
    });
  }

  return prisma.moduleProgress.findMany({ where: { userId, courseId } });
}

export async function recalculateLocks(userId, courseId) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { modules: { orderBy: { layer: 'asc' } } },
  });
  if (!course) return [];

  const rows = await prisma.moduleProgress.findMany({
    where: { userId, courseId, moduleId: { in: course.modules.map((m) => m.id) } },
  });
  const byLayer = new Map();
  for (const module of course.modules) {
    const row = rows.find((item) => item.moduleId === module.id);
    byLayer.set(module.layer, row);
  }

  const passed = (layer) => byLayer.get(layer)?.status === 'PASSED';
  const updates = [];

  for (const module of course.modules) {
    const row = byLayer.get(module.layer);
    if (!row) continue;
    if (row.status === 'PASSED') continue;

    let status;
    if (module.layer === 1) status = 'UNLOCKED';
    else if (passed(module.layer - 1)) status = row.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'UNLOCKED';
    else status = 'LOCKED';

    if (status !== row.status) {
      updates.push(prisma.moduleProgress.update({ where: { id: row.id }, data: { status } }));
    }
  }

  if (updates.length) await prisma.$transaction(updates);
  return prisma.moduleProgress.findMany({ where: { userId, courseId } });
}

/** Selective deletion: one module's progress, attempts, and cards disappear. */
export async function deleteModuleProgress(userId, moduleId) {
  const module = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!module) return null;

  await prisma.$transaction([
    prisma.moduleProgress.deleteMany({ where: { userId, moduleId } }),
    prisma.quizAttempt.deleteMany({ where: { userId, moduleId } }),
    prisma.flashcard.deleteMany({ where: { userId, moduleId } }),
    prisma.auditLog.create({
      data: { userId, action: 'progress:module_deleted', meta: toJson({ moduleId, courseId: module.courseId }) },
    }),
  ]);

  await ensureProgressRows(userId, module.courseId);
  await recalculateLocks(userId, module.courseId);
  return module;
}

/** Full reset: every attempt, card, and progress row for the learner. */
export async function resetAllProgress(userId) {
  const enrollments = await prisma.enrollment.findMany({ where: { userId }, select: { courseId: true } });

  await prisma.$transaction([
    prisma.quizAttempt.deleteMany({ where: { userId } }),
    prisma.flashcard.deleteMany({ where: { userId } }),
    prisma.moduleProgress.deleteMany({ where: { userId } }),
    prisma.auditLog.create({ data: { userId, action: 'progress:full_reset', meta: toJson({}) } }),
  ]);

  for (const enrollment of enrollments) {
    await ensureProgressRows(userId, enrollment.courseId);
  }

  return { coursesReset: enrollments.length };
}
