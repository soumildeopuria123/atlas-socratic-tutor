'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Course, CourseModule } from '@/lib/types';
import { Check, ChevronRight, Lock, Play, Sparkles, Timer, Trophy } from './icons';

interface Props {
  courses: Course[];
  onStudy: (course: Course, module: CourseModule) => void;
  onAssess: (course: Course, module: CourseModule, retest: boolean) => void;
  busy?: boolean;
}

const TIER_LABEL: Record<string, string> = {
  FOUNDATION: 'Foundation',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

function Node({
  course,
  module,
  active,
  onSelect,
  onStudy,
  onAssess,
  busy,
}: {
  course: Course;
  module: CourseModule;
  active: boolean;
  onSelect: () => void;
  onStudy: () => void;
  onAssess: (retest: boolean) => void;
  busy?: boolean;
}) {
  const passed = module.status === 'PASSED';
  const locked = module.status === 'LOCKED';
  const inProgress = module.status === 'IN_PROGRESS';

  return (
    <li className="relative pl-9">
      <span
        className={`absolute left-0 top-2 grid h-6 w-6 place-items-center rounded-full border-2 text-[10px] font-bold ${
          passed
            ? 'border-atlas-500 bg-atlas-500 text-white'
            : locked
              ? 'border-ink-300 bg-white text-ink-400 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-500'
              : inProgress
                ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                : 'border-atlas-500 bg-white text-atlas-600 dark:bg-ink-900 dark:text-atlas-400'
        }`}
      >
        {passed ? <Check className="h-3 w-3" /> : locked ? <Lock className="h-3 w-3" /> : module.layer}
      </span>

      <button
        type="button"
        onClick={onSelect}
        disabled={locked}
        className={`w-full rounded-xl border p-3 text-left transition ${
          locked
            ? 'cursor-not-allowed border-ink-200/60 bg-ink-50/40 dark:border-ink-800/70 dark:bg-ink-900/20'
            : active
              ? 'border-atlas-500 bg-white shadow-glow dark:border-atlas-500 dark:bg-ink-900'
              : 'border-ink-200 bg-white hover:border-atlas-300 dark:border-ink-800 dark:bg-ink-900/60 dark:hover:border-atlas-700'
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
            Layer {module.layer} · {TIER_LABEL[module.tier] ?? module.tier}
          </span>
          {passed && module.bestScore !== null ? (
            <span className="chip-green">
              <Trophy className="h-2.5 w-2.5" />
              {Math.round(module.bestScore * 100)}%
            </span>
          ) : null}
          {module.retestEligible ? <span className="chip-amber">retest ready</span> : null}
          {inProgress ? <span className="chip-neutral">in progress</span> : null}
        </div>
        <p
          className={`mt-1 text-[13.5px] font-semibold leading-snug ${
            locked ? 'text-ink-400 dark:text-ink-500' : 'text-ink-900 dark:text-white'
          }`}
        >
          {module.title}
        </p>
        {module.objective ? (
          <p className={`mt-1 line-clamp-2 text-[11.5px] leading-relaxed ${locked ? 'text-ink-400/80 dark:text-ink-600' : 'text-ink-500 dark:text-ink-400'}`}>
            {module.objective}
          </p>
        ) : null}
      </button>

      {active && !locked ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={onStudy} disabled={busy} className="btn-primary px-3 py-2 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            Study with Atlas
          </button>
          {!passed ? (
            <button
              type="button"
              onClick={() => onAssess(module.retestEligible)}
              disabled={busy}
              className="btn-secondary px-3 py-2 text-xs"
            >
              {module.retestEligible ? <Timer className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {module.retestEligible ? 'Retest (new variant)' : `Start assessment · ${module.tier === 'ADVANCED' ? '48' : module.tier === 'INTERMEDIATE' ? '30' : '18'} min`}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-atlas-200 bg-atlas-50 px-3 py-2 text-xs font-semibold text-atlas-700 dark:border-atlas-800 dark:bg-atlas-900/30 dark:text-atlas-300">
              <Check className="h-3.5 w-3.5" /> Layer cleared
            </span>
          )}
        </div>
      ) : null}
    </li>
  );
}

export default function SkillTreeView({ courses, onStudy, onAssess, busy }: Props) {
  const [slug, setSlug] = useState(courses[0]?.slug ?? '');
  const [selected, setSelected] = useState<number | null>(null);

  const course = useMemo(
    () => courses.find((item) => item.slug === slug) ?? courses[0],
    [courses, slug],
  );

  // Default the selection to the first actionable layer.
  useEffect(() => {
    if (!course) return;
    const actionable = course.modules.find(
      (module) => module.status === 'UNLOCKED' || module.status === 'IN_PROGRESS',
    );
    setSelected(actionable?.layer ?? course.modules[0]?.layer ?? null);
  }, [course]);

  if (!course) {
    return (
      <section className="panel p-6">
        <h2 className="text-sm font-semibold text-ink-900 dark:text-white">Skill tree</h2>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
          Enroll in a course to grow your ladder.
        </p>
      </section>
    );
  }

  return (
    <section className="panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-white">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-atlas-100 text-atlas-700 dark:bg-atlas-900/50 dark:text-atlas-300">
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
            Skill tree
          </h2>
          <p className="mt-1 text-[11px] text-ink-500 dark:text-ink-400">
            Nodes unlock strictly in order — pass at 75% to open the next.
          </p>
        </div>
        {courses.length > 1 ? (
          <select
            value={course.slug}
            onChange={(event) => setSlug(event.target.value)}
            className="input w-auto max-w-[13rem] py-1.5 text-xs"
            aria-label="Select course for skill tree"
          >
            {courses.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.title}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="relative">
        <span className="absolute left-3 top-2 bottom-8 w-px bg-gradient-to-b from-atlas-300 via-ink-200 to-transparent dark:from-atlas-700 dark:via-ink-700" />
        <ol className="space-y-3">
          {course.modules.map((module) => (
            <Node
              key={module.id}
              course={course}
              module={module}
              active={selected === module.layer}
              busy={busy}
              onSelect={() => setSelected(module.layer)}
              onStudy={() => onStudy(course, module)}
              onAssess={(retest) => onAssess(course, module, retest)}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}
