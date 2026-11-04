/**
 * Exports the JS curriculum to JSON so the Python ai-engine shares one source
 * of truth instead of maintaining a divergent copy.
 *
 *   node scripts/export-curriculum.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { COURSES, EXAM_SECONDS, PASS_THRESHOLD, tierForLayer } from '../atlas/curriculum.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(here, '..', '..', 'ai-engine', 'data', 'curriculum.json');

const payload = {
  generatedAt: new Date().toISOString(),
  passThreshold: PASS_THRESHOLD,
  examSeconds: EXAM_SECONDS,
  courses: COURSES.map((course) => ({
    ...course,
    layers: course.layers.map((layer) => ({ ...layer, tier: tierForLayer(layer.layer) })),
  })),
};

await mkdir(path.dirname(target), { recursive: true });
await writeFile(target, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

const layers = payload.courses.reduce((sum, course) => sum + course.layers.length, 0);
console.log(`[curriculum] wrote ${payload.courses.length} courses / ${layers} layers to ai-engine/data/curriculum.json`);
