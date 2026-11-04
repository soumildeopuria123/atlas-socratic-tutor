/**
 * Assessment generation.
 *
 * Every paper is built from the layer's curated content with a seed, so a retest
 * is genuinely a different variant while remaining solvable from the lesson.
 * Answers never leave the server until submission.
 */
import { PASS_THRESHOLD, QUESTIONS_PER_TEST, conceptPool, tierForLayer } from './curriculum.js';
import { pick, shuffle, uniqueBy } from './random.js';

function makeQuestion({ prompt, correct, distractors, explanation, concept, rng }) {
  const options = uniqueBy(
    shuffle([correct, ...distractors.filter((item) => item && item !== correct)], rng),
    (item) => item,
  ).slice(0, 4);

  // Defensive: if collisions left fewer than four options, pad with a generic
  // distractor so the paper always has four choices.
  while (options.length < 4) options.push(`None of these describe ${concept ?? 'the idea'}`);

  return {
    id: `q${Math.floor(rng() * 1e9).toString(36)}`,
    prompt,
    options,
    answer: options.indexOf(correct),
    explanation,
    concept: concept ?? null,
  };
}

export function generateQuiz({ course, module, seed }) {
  const rng = mulberry32Local(seed);
  const tier = tierForLayer(module.layer);
  const pool = conceptPool(course).filter((concept) => concept.layer !== module.layer);
  const localConcepts = module.concepts;
  const chosen = pick(localConcepts, 2, rng);
  const rest = localConcepts.filter((concept) => !chosen.includes(concept));

  const questions = [];

  // 1-2: term -> definition
  for (const idea of chosen) {
    const distractors = pick(
      pool.filter((item) => item.definition !== idea.definition),
      3,
      rng,
    ).map((item) => item.definition);
    questions.push(
      makeQuestion({
        prompt: `Which statement best defines **${idea.term}**?`,
        correct: idea.definition,
        distractors,
        explanation: `**${idea.term}** — ${idea.definition}`,
        concept: idea.term,
        rng,
      }),
    );
  }

  // 3-4: definition -> term
  for (const idea of rest) {
    const distractors = pick(
      pool.filter((item) => item.term !== idea.term),
      3,
      rng,
    ).map((item) => item.term);
    questions.push(
      makeQuestion({
        prompt: `Which term matches this description?\n\n> ${idea.definition}`,
        correct: idea.term,
        distractors,
        explanation: `That description is the definition of **${idea.term}**.`,
        concept: idea.term,
        rng,
      }),
    );
  }

  // 5: boundary check — a concept that belongs to a different layer
  const foreign = pick(pool, 1, rng)[0];
  questions.push(
    makeQuestion({
      prompt: `Which term is **not** taught in this layer (Layer ${module.layer} — ${module.title})?`,
      correct: foreign.term,
      distractors: pick(localConcepts, 3, rng).map((item) => item.term),
      explanation: `**${foreign.term}** belongs to Layer ${foreign.layer} of this course, not Layer ${module.layer}.`,
      concept: foreign.term,
      rng,
    }),
  );

  // 6: prerequisite awareness
  const previous = course.layers.find((layer) => layer.layer === module.layer - 1);
  if (previous) {
    const others = course.layers.filter((layer) => layer.layer !== previous.layer);
    questions.push(
      makeQuestion({
        prompt: `In ${course.title}, which layer must be passed before **${module.title}** can be studied?`,
        correct: previous.title,
        distractors: pick(others, 3, rng).map((layer) => layer.title),
        explanation: `Layer ${module.layer} builds directly on **Layer ${previous.layer} — ${previous.title}**, which must be passed first.`,
        concept: previous.concepts[0].term,
        rng,
      }),
    );
  } else {
    questions.push(
      makeQuestion({
        prompt: `Where does **${module.title}** sit in the ${course.title} ladder?`,
        correct: 'It is Layer 1 and assumes no prior knowledge',
        distractors: [
          'It is the final layer and requires all others',
          'It is an optional aside that can be skipped',
          'It assumes Layer 2 has already been passed',
        ],
        explanation: `Layer 1 is the foundation: Atlas never requires prior coursework for it.`,
        concept: localConcepts[0].term,
        rng,
      }),
    );
  }

  // 7: pitfall recognition — the error learners actually make
  const ownPitfall = pick(module.pitfalls, 1, rng)[0];
  const otherPitfalls = course.layers
    .filter((layer) => layer.layer !== module.layer)
    .flatMap((layer) => layer.pitfalls);
  questions.push(
    makeQuestion({
      prompt: `Which of these is a documented pitfall when working with **${module.title}**?`,
      correct: ownPitfall,
      distractors: pick(otherPitfalls, 3, rng),
      explanation: `The lesson flags this explicitly: ${ownPitfall}`,
      concept: localConcepts[0].term,
      rng,
    }),
  );

  // 8: applied checkpoint authored for the layer
  questions.push(
    makeQuestion({
      prompt: module.scenario.q,
      correct: module.scenario.options[module.scenario.answer],
      distractors: module.scenario.options.filter((_, index) => index !== module.scenario.answer),
      explanation: module.scenario.why,
      concept: localConcepts[0].term,
      rng,
    }),
  );

  return {
    questions,
    tier,
    passMark: Math.ceil(QUESTIONS_PER_TEST * PASS_THRESHOLD),
    meta: { courseSlug: course.slug, layer: module.layer, title: module.title, seed },
  };
}

/** Client-safe view: strips the answer key and the rationale. */
export function sanitizeQuiz(questions) {
  return questions.map((question, index) => ({
    id: question.id ?? `q${index}`,
    prompt: question.prompt,
    options: question.options,
  }));
}

export function gradeQuiz(questions, answers) {
  let correct = 0;
  const missedConcepts = [];
  const review = questions.map((question, index) => {
    const given = Number.isInteger(answers?.[index]) ? answers[index] : null;
    const isCorrect = given === question.answer;
    if (isCorrect) correct += 1;
    else if (question.concept) missedConcepts.push(question.concept);
    return {
      id: question.id,
      prompt: question.prompt,
      options: question.options,
      given,
      answer: question.answer,
      isCorrect,
      explanation: question.explanation,
      concept: question.concept,
    };
  });

  const score = questions.length ? correct / questions.length : 0;
  return {
    correct,
    total: questions.length,
    score,
    percent: Math.round(score * 100),
    passed: score >= PASS_THRESHOLD,
    missedConcepts: uniqueBy(missedConcepts, (item) => item),
    review,
  };
}

// Local import kept tiny to avoid a circular dependency through random.js helpers.
function mulberry32Local(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
