/**
 * End-to-end API smoke test against a running server.
 *
 *   node scripts/smoke.mjs
 *
 * Creates a disposable learner, runs the whole loop — signup -> enrollment ->
 * lesson -> locked-layer refusal -> assessment -> grading -> unlock ->
 * flashcard seeding -> SRS review — then deletes the account so repeat runs are
 * clean and no demo data is touched.
 *
 * The test reads the answer key directly from the dev database (something a real
 * client cannot do) so the passing path is verifiable without solving the paper.
 */
import 'dotenv/config';
import { prisma } from '../db.js';

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:4000';
const USERNAME = `smoke_${Date.now().toString(36)}`;
const PASSWORD = 'SmokeTest123';

let cookie = '';
let failures = 0;
let userId = null;

function check(label, condition, detail = '') {
  const mark = condition ? 'PASS' : 'FAIL';
  if (!condition) failures += 1;
  console.log(`[${mark}] ${label}${detail ? ` — ${detail}` : ''}`);
}

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: response.status, data };
}

async function main() {
  const health = await request('/health');
  check('health endpoint', health.status === 200 && health.data?.ok === true);

  const signup = await request('/auth/signup', { method: 'POST', body: { username: USERNAME, password: PASSWORD } });
  check('signup provisions credits', signup.status === 201 && signup.data?.user?.credits === 60);
  userId = signup.data?.user?.id ?? null;

  const enroll = await request('/courses/trigonometry/enroll', { method: 'POST' });
  check('enrollment seeds layer 1', enroll.status === 201 && enroll.data?.course?.modules?.[0]?.status === 'UNLOCKED');

  const lesson = await request('/tutor/lesson', { method: 'POST', body: { courseSlug: 'trigonometry', layer: 1 } });
  check('layer 1 lesson generated', lesson.status === 200, `engine=${lesson.data?.lesson?.meta?.engine}`);
  check('lesson contains a markdown table', String(lesson.data?.lesson?.markdown).includes('| Ratio |'));
  check('lesson contains a mermaid diagram', String(lesson.data?.lesson?.markdown).includes('```mermaid'));
  check('checkpoint is structured, not duplicated in prose', Boolean(lesson.data?.lesson?.checkpoint?.options?.length === 4) && !String(lesson.data?.lesson?.markdown).includes('### Checkpoint'));

  const locked = await request('/tutor/lesson', { method: 'POST', body: { courseSlug: 'trigonometry', layer: 3 } });
  check('locked layer is refused', locked.status === 403 && locked.data?.code === 'LAYER_LOCKED');

  const start = await request('/assessment/start', { method: 'POST', body: { courseSlug: 'trigonometry', layer: 1 } });
  check('assessment start', start.status === 201, `tier=${start.data?.attempt?.tier}`);
  check('questions are answer-free on the wire', !JSON.stringify(start.data?.attempt?.questions ?? []).includes('"answer"'));
  check('timer is difficulty-scaled', start.data?.attempt?.durationSeconds === 1080, `${start.data?.attempt?.durationSeconds}s`);

  const attemptId = start.data?.attempt?.id;
  const stored = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });
  const raw = stored?.questions;
  const questions = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const answers = questions.map((question) => question.answer);

  const submit = await request(`/assessment/${attemptId}/submit`, { method: 'POST', body: { answers } });
  check('submission graded', submit.status === 200, `${submit.data?.result?.percent}%`);
  check('75% pass gate respected', submit.data?.passed === true && submit.data?.result?.percent >= 75);
  check('mastery reward paid', (submit.data?.credits ?? 0) > 0);

  const after = await request('/progress');
  const trig = after.data?.courses?.find((course) => course.slug === 'trigonometry');
  const layer2 = trig?.modules?.find((module) => module.layer === 2);
  const cards = userId ? await prisma.flashcard.count({ where: { userId } }) : 0;
  check('next layer unlocked after mastery', layer2?.status === 'UNLOCKED');
  check('flashcards seeded on pass', cards >= 4, `${cards} cards`);

  const deck = await request('/srs');
  check('SRS deck serves due cards', (deck.data?.due?.length ?? 0) >= 4, `${deck.data?.due?.length} due`);

  if (deck.data?.due?.length) {
    const reviewed = await request(`/srs/${deck.data.due[0].id}/review`, { method: 'POST', body: { quality: 5 } });
    check('SM-2 review scheduled', reviewed.status === 200 && reviewed.data?.card?.interval >= 1, `interval=${reviewed.data?.card?.interval}d`);
  }

  const reset = await request('/progress/reset', { method: 'POST', body: { confirm: 'WRONG' } });
  check('reset requires explicit confirmation', reset.status === 400);

  const sandbox = await request('/sandbox/run', { method: 'POST', body: { language: 'javascript', code: 'console.log(6*7)' } });
  check('sandbox executes JavaScript', sandbox.status === 200 && sandbox.data?.stdout?.trim() === '42', sandbox.data?.message ?? '');

  console.log(failures ? `\n${failures} check(s) failed.` : '\nAll smoke checks passed.');
}

async function cleanup() {
  if (userId) {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    console.log('[cleanup] disposable learner removed');
  }
  await prisma.$disconnect();
}

main()
  .catch((error) => {
    failures += 1;
    console.error('Smoke test crashed:', error);
  })
  .finally(async () => {
    await cleanup();
    process.exit(failures ? 1 : 0);
  });
