/**
 * The single source of truth for Atlas' deep-domain catalogue.
 *
 * Pedagogical contract, enforced by the assessment engine:
 *   - every course is an ordered ladder of exactly five layers
 *   - layer 1 assumes nothing
 *   - layer N+1 unlocks only after layer N is passed at >= 75%
 *   - retests always generate a new variant, never the same paper
 */
import { trigonometry, calculus, linearAlgebra } from './courses/mathematics.js';
import { dataStructures, algorithms, operatingSystems } from './courses/computer-science.js';
import { machineLearning, techEthics } from './courses/ai-ethics.js';

export const COURSES = [
  trigonometry,
  calculus,
  linearAlgebra,
  dataStructures,
  algorithms,
  operatingSystems,
  machineLearning,
  techEthics,
];

export const PASS_THRESHOLD = 0.75;
export const QUESTIONS_PER_TEST = 8;

const TIER_BY_LAYER = { 1: 'FOUNDATION', 2: 'FOUNDATION', 3: 'INTERMEDIATE', 4: 'INTERMEDIATE', 5: 'ADVANCED' };

/** Exam length in seconds. Layers 1-2 are short, layer 5 is a real sitting. */
export const EXAM_SECONDS = {
  FOUNDATION: 18 * 60,
  INTERMEDIATE: 30 * 60,
  ADVANCED: 48 * 60,
};

export const TIER_LABEL = {
  FOUNDATION: 'Foundation',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

export function tierForLayer(layer) {
  return TIER_BY_LAYER[layer] ?? 'FOUNDATION';
}

export function examSecondsFor(tier) {
  return EXAM_SECONDS[tier] ?? EXAM_SECONDS.FOUNDATION;
}

export function getCourse(slug) {
  return COURSES.find((course) => course.slug === slug) ?? null;
}

/** A module is a course layer plus the course metadata needed to teach it. */
export function getModule(courseSlug, layer) {
  const course = getCourse(courseSlug);
  if (!course) return null;
  const mod = course.layers.find((item) => item.layer === Number(layer));
  if (!mod) return null;
  return { course, module: mod };
}

export function allModules() {
  return COURSES.flatMap((course) =>
    course.layers.map((layer) => ({ course, module: layer, tier: tierForLayer(layer.layer) })),
  );
}

/** Full concept pool for a course, used to build plausible distractors. */
export function conceptPool(course) {
  return course.layers.flatMap((layer) =>
    layer.concepts.map((concept) => ({ ...concept, layer: layer.layer })),
  );
}

export function moduleSummary(course, module) {
  return {
    id: `${course.slug}:${module.layer}`,
    layer: module.layer,
    title: module.title,
    tier: tierForLayer(module.layer),
    minutes: module.minutes,
    objectives: module.objectives,
    conceptTerms: module.concepts.map((concept) => concept.term),
    isFinalLayer: module.layer === course.layers.length,
  };
}

export function publicCourse(course) {
  return {
    slug: course.slug,
    title: course.title,
    discipline: course.discipline,
    level: course.level,
    icon: course.icon,
    summary: course.summary,
    layerCount: course.layers.length,
    modules: course.layers.map((layer) => moduleSummary(course, layer)),
  };
}
