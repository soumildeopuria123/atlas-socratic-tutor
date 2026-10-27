import test from 'node:test';
import assert from 'node:assert/strict';

import { COURSES, PASS_THRESHOLD, examSecondsFor, tierForLayer } from '../atlas/curriculum.js';
import { generateQuiz, gradeQuiz, sanitizeQuiz } from '../atlas/quiz.js';
import { buildLesson, buildRemediation } from '../atlas/tutor.js';
import { scheduleReview } from '../routes/srs.js';

const trig = COURSES.find((course) => course.slug === 'trigonometry');

test('every course is a five-layer ladder that starts from zero', () => {
  assert.equal(COURSES.length, 8);
  for (const course of COURSES) {
    assert.equal(course.layers.length, 5, course.slug);
    course.layers.forEach((layer, index) => {
      assert.equal(layer.layer, index + 1, `${course.slug} layer numbering`);
      assert.ok(layer.objectives.length >= 3, `${course.slug} L${layer.layer} objectives`);
      assert.equal(layer.concepts.length, 4, `${course.slug} L${layer.layer} concepts`);
      assert.ok(layer.table.head.length >= 3, `${course.slug} L${layer.layer} table`);
      assert.match(layer.diagram, /^(flowchart|stateDiagram)/, `${course.slug} L${layer.layer} diagram`);
      assert.equal(layer.scenario.options.length, 4, `${course.slug} L${layer.layer} scenario`);
      assert.ok(layer.scenario.answer >= 0 && layer.scenario.answer < 4);
      assert.ok(layer.minutes >= 15 && layer.minutes <= 35);
      assert.equal(layer.tier, tierForLayer(layer.layer));
    });
    assert.equal(course.layers[0].layer, 1);
  }
});

test('foundation layers get short exams and advanced layers get long ones', () => {
  assert.equal(examSecondsFor('FOUNDATION'), 18 * 60);
  assert.equal(examSecondsFor('INTERMEDIATE'), 30 * 60);
  assert.equal(examSecondsFor('ADVANCED'), 48 * 60);
});

test('quiz generation is deterministic for a seed and never leaks the key', () => {
  const layer = trig.layers[1];
  const first = generateQuiz({ course: trig, module: layer, seed: 4242 });
  const second = generateQuiz({ course: trig, module: layer, seed: 4242 });
  assert.deepEqual(first.questions, second.questions);
  assert.equal(first.questions.length, 8);
  assert.equal(first.passMark, 6);

  for (const question of first.questions) {
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options).size, 4);
    assert.ok(question.answer >= 0 && question.answer < 4);
    assert.ok(question.concept);
  }

  const wire = sanitizeQuiz(first.questions);
  assert.equal(wire.length, 8);
  for (const question of wire) {
    assert.equal(question.answer, undefined);
    assert.equal(question.explanation, undefined);
    assert.equal(question.options.length, 4);
  }
});

test('different seeds produce different variants', () => {
  const layer = trig.layers[1];
  const a = generateQuiz({ course: trig, module: layer, seed: 1 });
  const b = generateQuiz({ course: trig, module: layer, seed: 2 });
  assert.notDeepEqual(a.questions, b.questions);
});

test('75% is the exact pass boundary', () => {
  const layer = trig.layers[2];
  const quiz = generateQuiz({ course: trig, module: layer, seed: 99 });
  const correct = quiz.questions.map((question) => question.answer);

  const perfect = gradeQuiz(quiz.questions, correct);
  assert.equal(perfect.percent, 100);
  assert.equal(perfect.passed, true);

  const six = gradeQuiz(
    quiz.questions,
    quiz.questions.map((question, index) => (index < 6 ? question.answer : (question.answer + 1) % 4)),
  );
  assert.equal(six.correct, 6);
  assert.equal(six.passed, true);
  assert.ok(PASS_THRESHOLD <= six.score);

  const five = gradeQuiz(
    quiz.questions,
    quiz.questions.map((question, index) => (index < 5 ? question.answer : (question.answer + 1) % 4)),
  );
  assert.equal(five.correct, 5);
  assert.equal(five.passed, false);
  assert.ok(five.missedConcepts.length > 0);
  assert.equal(five.review.length, 8);
  assert.equal(five.review[0].explanation.length > 0, true);
});

test('lessons contain the layer contract and defer the checkpoint to the UI', () => {
  const layer = trig.layers[1];
  const lesson = buildLesson({ course: trig, module: layer });
  assert.match(lesson.markdown, new RegExp(`Layer 2 · ${layer.title}`));
  assert.match(lesson.markdown, /### Worked example/);
  assert.match(lesson.markdown, /\| Angle \| Radians \|/);
  assert.match(lesson.markdown, /```mermaid/);
  assert.doesNotMatch(lesson.markdown, /### Checkpoint/);
  assert.equal(lesson.checkpoint.options.length, 4);
  assert.ok(lesson.socraticPrompt.length > 20);
  assert.equal(lesson.meta.layer, 2);
});

test('remediation mode keeps the checkpoint in prose and names the gaps', () => {
  const layer = trig.layers[3];
  const remediation = buildRemediation(trig, layer, ['Double-angle identity'], 0.5);
  assert.match(remediation.markdown, /Remediation/);
  assert.match(remediation.markdown, /50%/);
  assert.match(remediation.markdown, /Double-angle identity/);
  assert.match(remediation.markdown, /### Checkpoint/);
});

test('SM-2 schedules intervals and handles lapses', () => {
  const fresh = { easeFactor: 2.5, interval: 0, repetitions: 0, lapses: 0 };
  const first = scheduleReview(fresh, 5);
  assert.equal(first.interval, 1);
  assert.equal(first.repetitions, 1);
  assert.ok(first.easeFactor > 2.5);

  const second = scheduleReview({ ...fresh, ...first }, 5);
  assert.equal(second.interval, 6);
  assert.equal(second.repetitions, 2);

  const third = scheduleReview({ ...fresh, ...second }, 4);
  assert.ok(third.interval >= 6);
  assert.equal(third.repetitions, 3);

  const lapse = scheduleReview({ ...fresh, ...second }, 1);
  assert.equal(lapse.interval, 1);
  assert.equal(lapse.repetitions, 0);
  assert.equal(lapse.lapses, 1);
  assert.ok(lapse.easeFactor < second.easeFactor);
  assert.ok(lapse.dueAt.getTime() > Date.now());
});
