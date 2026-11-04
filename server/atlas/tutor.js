/**
 * Atlas' teaching surface.
 *
 * The engine is deterministic by design: every answer is assembled from the
 * curated curriculum so a learner can never be told something the course does
 * not stand behind. When AI_ENGINE_URL is configured the server proxies to the
 * Python orchestration service, which applies the same contract with optional
 * LLM enrichment.
 */
import { COURSES, PASS_THRESHOLD, TIER_LABEL, tierForLayer } from './curriculum.js';
import { mulberry32, pick, shuffle, uniqueBy } from './random.js';

const cell = (value) => String(value).replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();

function markdownTable(table) {
  const head = `| ${table.head.map(cell).join(' | ')} |`;
  const divider = `| ${table.head.map(() => '---').join(' | ')} |`;
  const rows = table.rows.map((row) => `| ${row.map(cell).join(' | ')} |`);
  return [head, divider, ...rows].join('\n');
}

function fence(language, body) {
  return ['```' + language, body, '```'].join('\n');
}

function socraticPromptFor(course, module, rng) {
  const [first, second] = module.concepts;
  const templates = [
    `Before we move on: in your own words, what would break if **${first.term}** did not exist?`,
    `Try this before scrolling on — how would you explain **${first.term}** to a friend using only the idea of **${second.term}**?`,
    `A quick self-check: which part of **${module.title}** still feels like a rule you memorised rather than a consequence you could derive?`,
    `If I changed one assumption in the worked example above, where would **${first.term}** stop being valid?`,
  ];
  return pick(templates, 1, rng)[0];
}

/**
 * Builds the full layer lesson. `mode: 'lesson'` teaches the layer;
 * `mode: 'remediation'` re-teaches only the concepts a failed exam exposed.
 */
export function buildLesson({ course, module, mode = 'lesson', weakConcepts = [] }) {
  const rng = mulberry32(module.layer * 7919 + course.slug.length);
  const tier = tierForLayer(module.layer);
  const previous = course.layers.find((layer) => layer.layer === module.layer - 1);
  const next = course.layers.find((layer) => layer.layer === module.layer + 1);
  const focus =
    mode === 'remediation' && weakConcepts.length
      ? module.concepts.filter((concept) => weakConcepts.includes(concept.term))
      : module.concepts;
  const concepts = focus.length ? focus : module.concepts;

  const parts = [];

  parts.push(`## Layer ${module.layer} · ${module.title}`);
  parts.push(
    `**${course.title}** · ${TIER_LABEL[tier]} · ~${module.minutes} min · Layer ${module.layer} of ${course.layers.length}`,
  );

  if (mode === 'remediation') {
    parts.push(
      `> **Remediation mode.** Your last attempt scored below ${Math.round(
        PASS_THRESHOLD * 100,
      )}%, so Atlas is re-teaching the exact ideas that slipped — ${weakConcepts
        .map((term) => `**${term}**`)
        .join(', ')} — before you retest. Nothing here is new; it is the same layer, slower.`,
    );
  } else if (previous) {
    parts.push(
      `> You are building on **Layer ${previous.layer} — ${previous.title}**. If that layer still feels shaky, revisit it; this one assumes it.`,
    );
  } else {
    parts.push(
      '> **Start here.** This is the foundation layer: it assumes no prior trigonometry, no notation, and no vocabulary. Everything is built from scratch.',
    );
  }

  parts.push('### What you will be able to do');
  parts.push(module.objectives.map((objective) => `- ${objective}`).join('\n'));

  parts.push('### The ideas, one at a time');
  concepts.forEach((concept, index) => {
    parts.push(`#### ${index + 1}. ${concept.term}`);
    parts.push(concept.definition);
  });

  parts.push('### The intuition underneath');
  parts.push(module.intuition);

  parts.push('### Worked example');
  parts.push(`**Problem.** ${module.worked.problem}`);
  parts.push(module.worked.steps.map((step, index) => `${index + 1}. ${step}`).join('\n'));
  parts.push(`**Answer.** ${module.worked.answer}`);

  parts.push(`### Reference: ${module.table.caption}`);
  parts.push(markdownTable(module.table));

  parts.push('### How it fits together');
  parts.push(fence('mermaid', module.diagram));

  parts.push('### Where learners slip');
  parts.push(module.pitfalls.map((pitfall) => `- ${pitfall}`).join('\n'));

  // The interactive checkpoint travels as structured data and renders as a
  // clickable card in chat. Only remediation embeds it in the prose, because
  // that screen renders markdown alone.
  if (mode === 'remediation') {
    parts.push('### Checkpoint');
    parts.push(module.scenario.q);
    module.scenario.options.forEach((option, index) => {
      parts.push(`${String.fromCharCode(65 + index)}. ${option}`);
    });
    parts.push('_Try this before the retest; the answer is in the worked example above._');
  }

  if (next) {
    parts.push(
      `### After this layer\nLayer ${next.layer} — **${next.title}** — unlocks once you pass the Layer ${module.layer} assessment at ${Math.round(
        PASS_THRESHOLD * 100,
      )}% or higher.`,
    );
  } else {
    parts.push(
      `### After this layer\nThis is the final layer of **${course.title}**. Passing it completes the ladder and seeds your spaced-repetition deck for the whole course.`,
    );
  }

  return {
    markdown: parts.join('\n\n'),
    checkpoint: module.scenario,
    socraticPrompt: socraticPromptFor(course, module, rng),
    meta: {
      courseSlug: course.slug,
      courseTitle: course.title,
      layer: module.layer,
      title: module.title,
      tier,
      minutes: module.minutes,
      mode,
      totalLayers: course.layers.length,
    },
  };
}

/** Course map shown when a learner opens a course in Atlas without a layer. */
export function buildCourseOverview(course, progressByLayer = {}) {
  const rows = course.layers.map((layer) => {
    const status = progressByLayer[layer.layer] ?? 'LOCKED';
    const glyph =
      status === 'PASSED' ? '✅ passed' : status === 'LOCKED' ? '🔒 locked' : '▶ available';
    return [layer.layer, layer.title, TIER_LABEL[tierForLayer(layer.layer)], `${layer.minutes} min`, glyph];
  });

  const rng = mulberry32(course.slug.length * 104729);
  const first = course.layers[0];

  return {
    markdown: [
      `## ${course.title}`,
      `${course.summary}`,
      `**Discipline:** ${course.discipline} · **Level:** ${course.level} · **Layers:** ${course.layers.length}`,
      '### The ladder',
      markdownTable({ head: ['Layer', 'Focus', 'Tier', 'Study time', 'Status'], rows }),
      '### The rule of the ladder',
      `Atlas never opens a layer you have not earned. Each layer ends in a timed assessment; ${Math.round(
        PASS_THRESHOLD * 100,
      )}% is the pass mark. Below that, the advanced layers stay locked and the next attempt is a **new variant**, not the same paper.`,
      `### Start here\nLayer 1 — **${first.title}**. ${first.objectives[0]}.`,
      `_Ask me anything about this course, or request "teach me layer 1" to begin._`,
    ].join('\n\n'),
    socraticPrompt: `What do you already believe about **${first.concepts[0].term}** — even a rough guess? Wrong guesses are the most useful starting point we have.`,
    meta: { courseSlug: course.slug, courseTitle: course.title, layer: null, totalLayers: course.layers.length },
  };
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ');
}

/** Finds the most specific concept mentioned in free text. */
function findConcept(message) {
  const text = normalize(message);
  let best = null;
  for (const course of COURSES) {
    for (const layer of course.layers) {
      for (const concept of layer.concepts) {
        const term = normalize(concept.term.replace(/\(.*?\)/g, '')).trim();
        if (!term) continue;
        const matched = term
          .split(/\s+/)
          .filter((word) => word.length > 3)
          .some((word) => text.includes(word));
        if (matched && (!best || term.length > best.term.length)) {
          best = { course, layer, concept, term };
        }
      }
    }
  }
  return best;
}

function findCourse(message) {
  const text = normalize(message);
  return (
    COURSES.find((course) => text.includes(normalize(course.title))) ??
    COURSES.find((course) => course.discipline && text.includes(normalize(course.discipline))) ??
    null
  );
}

const MOVES = [
  (term) => `If you had to teach **${term}** to someone who has never seen the notation, where would you start: a picture, an example, or a definition? Pick one and I will build from there.`,
  (term) => `Here is a sharper question: what would have to be true for **${term}** to fail? Naming the failure case is the fastest way to own the idea.`,
  (term) => `Try restating **${term}** without using the word itself. What survives the rewording is what you actually understand.`,
  (term) => `Which feels closer to your current picture of **${term}** — a rule you apply, or a mechanism you can explain? Answer honestly and I will pitch the next step correctly.`,
];

/**
 * Socratic reply for free-text messages. Deterministic, curriculum-grounded,
 * and always ends with a question the learner has to answer.
 */
export function buildSocraticReply({ message, enrolled = [], progress = {} }) {
  const concept = findConcept(message);
  const asksForQuiz = /\bquiz|test me|check me|practice question\b/i.test(message);
  const wantsLayer = message.match(/layer\s*(\d)/i);

  if (asksForQuiz) {
    const course = concept?.course ?? findCourse(message) ?? enrolled[0]?.course ?? COURSES[0];
    const layerNumber = concept?.layer.layer ?? Number(wantsLayer?.[1]) ?? 1;
    const layer = course.layers.find((item) => item.layer === layerNumber) ?? course.layers[0];
    const scenario = layer.scenario;
    return {
      markdown: [
        `### Quick check · ${course.title}, Layer ${layer.layer}`,
        scenario.q,
        scenario.options.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join('\n'),
        `Tell me your answer and reasoning — I will not just mark it right or wrong, I will show you which concept decided it.`,
      ].join('\n\n'),
      checkpoint: scenario,
      meta: { courseSlug: course.slug, layer: layer.layer, mode: 'checkpoint' },
    };
  }

  if (concept) {
    const { course, layer, concept: idea } = concept;
    const needsUnlock = progress?.[course.slug]?.[layer.layer] === 'LOCKED';
    const rng = mulberry32(message.length + layer.layer * 31 + course.slug.length);
    const sibling = layer.concepts.find((item) => item.term !== idea.term) ?? layer.concepts[0];

    const body = [
      `### ${idea.term}`,
      `**In one sentence.** ${idea.definition}`,
      `**Where it lives.** Layer ${layer.layer} — *${layer.title}* in **${course.title}** (${TIER_LABEL[
        tierForType(layer)
      ]}, ~${layer.minutes} min).`,
      `**Why it exists.** ${layer.intuition}`,
      `**A concrete handle.** ${layer.worked.problem} → ${layer.worked.answer}`,
      `### Structure of the idea`,
      fence('mermaid', layer.diagram),
      `### Compare it with its neighbour`,
      markdownTable({
        head: ['Idea', 'Working definition', 'Layer'],
        rows: [
          [idea.term, idea.definition, `Layer ${layer.layer}`],
          [sibling.term, sibling.definition, `Layer ${layer.layer}`],
        ],
      }),
      `### Common trap`,
      layer.pitfalls[0],
      MOVES[Math.floor(rng() * MOVES.length)](idea.term),
    ];

    if (needsUnlock) {
      body.splice(
        2,
        0,
        `> 🔒 Layer ${layer.layer} is currently locked on your dashboard. You can discuss it, but the lesson and assessment unlock after you pass Layer ${Math.max(
          1,
          layer.layer - 1,
        )}.`,
      );
    }

    return {
      markdown: body.join('\n\n'),
      socraticPrompt: MOVES[Math.floor(rng() * MOVES.length)](idea.term),
      meta: { courseSlug: course.slug, courseTitle: course.title, layer: layer.layer, mode: 'concept' },
    };
  }

  const course = findCourse(message) ?? enrolled[0]?.course ?? null;
  const candidate = course ?? COURSES[0];
  const rng = mulberry32(message.length * 7 + candidate.slug.length);
  const suggestions = pick(candidate.layers, 3, rng).map(
    (layer) => `- **Layer ${layer.layer} — ${layer.title}**: ${layer.objectives[0]}`,
  );

  return {
    markdown: [
      `I want to answer precisely rather than generically, so let me anchor us first.`,
      `You are asking something in the neighbourhood of **${candidate.title}**. Within that ladder, the three ideas most likely to be what you need are:`,
      suggestions.join('\n'),
      `Tell me which one is closest — or name the exact term you are stuck on — and I will take you through it from the layer that introduces it, with a worked example, a reference table, and a diagram.`,
    ].join('\n\n'),
    socraticPrompt: `Which of those three feels closest to your question — and what have you already tried?`,
    meta: { courseSlug: candidate.slug, courseTitle: candidate.title, layer: null, mode: 'disambiguation' },
  };
}

// Diagram lookup helper kept local so a layer's tier can be derived in replies.
function tierForType(layer) {
  return tierForLayer(layer.layer);
}

/** Re-teaching plan after a failed attempt, keyed to the questions missed. */
export function buildRemediation(course, module, missedConcepts, score) {
  const unique = uniqueBy(missedConcepts, (item) => item).slice(0, 4);
  const lesson = buildLesson({ course, module, mode: 'remediation', weakConcepts: unique });
  const rng = mulberry32(module.layer * 13 + Math.round(score * 100));

  const drill = unique.map((term) => {
    const idea = module.concepts.find((concept) => concept.term === term);
    return idea ? `- **${idea.term}** — ${idea.definition}` : `- **${term}**`;
  });

  return {
    markdown: [
      `## Remediation · ${course.title}, Layer ${module.layer}`,
      `Your attempt scored **${Math.round(score * 100)}%**. The pass mark is ${Math.round(
        PASS_THRESHOLD * 100,
      )}%, so Layer ${module.layer + 1 <= course.layers.length ? module.layer + 1 : module.layer} stays locked until you clear this one.`,
      `### The exact gaps`,
      drill.length ? drill.join('\n') : module.pitfalls.map((pitfall) => `- ${pitfall}`).join('\n'),
      `### Re-teach, slowly`,
      lesson.markdown,
      `### Your retest`,
      `A retest is now available on your dashboard. It is a **newly generated variant** — different concept sampling, different distractors, different ordering — so memorising the last paper will not help.`,
      `When you are ready, tell me "quiz me" and I will warm you up with one question first.`,
    ].join('\n\n'),
    socraticPrompt: MOVES[Math.floor(rng() * MOVES.length)](unique[0] ?? module.concepts[0].term),
    meta: { courseSlug: course.slug, layer: module.layer, mode: 'remediation', score },
  };
}

/** Small stable helper used by the chat route for suggested follow-ups. */
export function suggestedFollowUps(course, layer) {
  return shuffle(
    [
      `Teach me Layer ${Math.min(layer + 1, course.layers.length)}`,
      `Quiz me on Layer ${layer}`,
      'Show me a diagram of how this connects',
      'Why does this rule exist?',
    ],
    mulberry32(layer + course.slug.length),
  ).slice(0, 3);
}
