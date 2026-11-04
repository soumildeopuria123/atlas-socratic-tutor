/**
 * Seeds the course catalogue from the single source of truth in atlas/courses.
 * Idempotent: safe to re-run after editing any curriculum file.
 *
 * Optional demo account:
 *   SEED_DEMO=true npm run db:seed
 */
import bcrypt from 'bcryptjs';
import { prisma, toJson } from './db.js';
import { COURSES, tierForLayer } from './atlas/curriculum.js';

async function seedCatalogue() {
  let modules = 0;

  for (const [index, course] of COURSES.entries()) {
    const dbCourse = await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        title: course.title,
        discipline: course.discipline,
        level: course.level,
        summary: course.summary,
        order: index,
      },
      create: {
        slug: course.slug,
        title: course.title,
        discipline: course.discipline,
        level: course.level,
        summary: course.summary,
        order: index,
      },
    });

    for (const layer of course.layers) {
      await prisma.module.upsert({
        where: { courseId_layer: { courseId: dbCourse.id, layer: layer.layer } },
        update: {
          title: layer.title,
          tier: tierForLayer(layer.layer),
          minutes: layer.minutes,
          concepts: toJson(layer.concepts),
        },
        create: {
          courseId: dbCourse.id,
          layer: layer.layer,
          title: layer.title,
          tier: tierForLayer(layer.layer),
          minutes: layer.minutes,
          concepts: toJson(layer.concepts),
        },
      });
      modules += 1;
    }
  }

  console.log(`[seed] ${COURSES.length} courses, ${modules} layers ready.`);
}

async function seedDemo() {
  const username = process.env.DEMO_USERNAME ?? 'atlas_demo';
  const password = process.env.DEMO_PASSWORD ?? 'AtlasDemo123';
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { username },
    update: {},
    create: { username, passwordHash, credits: 60 },
  });

  const user = await prisma.user.findUnique({ where: { username } });
  const slugs = ['trigonometry', 'data-structures'];
  for (const slug of slugs) {
    const course = await prisma.course.findUnique({ where: { slug }, include: { modules: true } });
    if (!course) continue;
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      update: {},
      create: { userId: user.id, courseId: course.id },
    });
    for (const module of course.modules) {
      await prisma.moduleProgress.upsert({
        where: { userId_moduleId: { userId: user.id, moduleId: module.id } },
        update: {},
        create: {
          userId: user.id,
          courseId: course.id,
          moduleId: module.id,
          status: module.layer === 1 ? 'UNLOCKED' : 'LOCKED',
        },
      });
    }
  }

  console.log(`[seed] demo account: ${username} / ${password} (credit balance 60)`);
}

async function main() {
  await seedCatalogue();
  if (process.env.SEED_DEMO === 'true') await seedDemo();
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('[seed] failed:', error);
  await prisma.$disconnect();
  process.exit(1);
});
