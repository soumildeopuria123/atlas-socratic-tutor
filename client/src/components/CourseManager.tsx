'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ApiError, del, post } from '@/lib/api';
import type { Course } from '@/lib/types';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  Layers,
  Loader,
  Lock,
  Terminal,
  X,
} from './icons';

interface Props {
  courses: Course[];
  onChanged: () => Promise<void>;
  onOpen: (course: Course) => void;
}

const ICONS: Record<string, typeof BookOpen> = {
  triangle: Layers,
  curve: ArrowRight,
  grid: Layers,
  tree: Layers,
  route: Brain,
  cpu: Terminal,
  network: Brain,
  scales: BookOpen,
};

export default function CourseManager({ courses, onChanged, onOpen }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');

  const disciplines = ['All', ...Array.from(new Set(courses.map((course) => course.discipline)))];
  const visible = courses.filter((course) => filter === 'All' || course.discipline === filter);

  async function toggle(course: Course) {
    setBusy(course.slug);
    setError(null);
    try {
      if (course.enrolled) {
        await del(`/courses/${course.slug}/enroll`);
      } else {
        await post(`/courses/${course.slug}/enroll`);
      }
      await onChanged();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not update enrollment.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink-900 dark:text-white">Course catalogue</h2>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Eight deep-domain ladders. Each one starts at zero and climbs five layers to advanced application.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {disciplines.map((discipline) => (
            <button
              key={discipline}
              type="button"
              onClick={() => setFilter(discipline)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                filter === discipline
                  ? 'border-ink-900 bg-ink-900 text-white dark:border-atlas-500 dark:bg-atlas-600'
                  : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'
              }`}
            >
              {discipline}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertTriangle className="h-3.5 w-3.5" /> {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((course) => {
          const Icon = ICONS[course.icon ?? ''] ?? BookOpen;
          const passed = course.modules.filter((module) => module.status === 'PASSED').length;
          return (
            <article
              key={course.slug}
              className={`panel flex flex-col p-5 transition hover:shadow-lg ${
                course.enrolled ? 'ring-1 ring-atlas-400/40 dark:ring-atlas-600/40' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-ink-900 to-ink-700 text-white dark:from-atlas-500 dark:to-atlas-700">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[15px] font-semibold text-ink-900 dark:text-white">
                      {course.title}
                    </h3>
                    {course.enrolled ? <Check className="h-4 w-4 shrink-0 text-atlas-600 dark:text-atlas-400" /> : null}
                  </div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
                    {course.discipline} · {course.level}
                  </p>
                </div>
              </div>

              <p className="mt-3 line-clamp-3 flex-1 text-[12.5px] leading-relaxed text-ink-500 dark:text-ink-400">
                {course.summary}
              </p>

              <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-ink-500 dark:text-ink-400">
                <Layers className="h-3.5 w-3.5" /> {course.layerCount} layers
                {course.enrolled ? (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-atlas-50 px-2 py-0.5 font-semibold text-atlas-700 dark:bg-atlas-900/30 dark:text-atlas-300">
                    {passed}/{course.layerCount} passed
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex items-center gap-2">
                {course.enrolled ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpen(course)}
                      className="btn-primary flex-1 py-2 text-xs"
                    >
                      Open in Atlas <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(course)}
                      disabled={busy === course.slug}
                      className="btn-secondary px-3 py-2 text-xs"
                      title="De-enroll and remove this course's progress"
                    >
                      {busy === course.slug ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                      De-enroll
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggle(course)}
                    disabled={busy === course.slug}
                    className="btn-primary w-full py-2 text-xs"
                  >
                    {busy === course.slug ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                    Enroll · start at layer 1
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-5 text-center text-[11px] text-ink-400 dark:text-ink-500">
        De-enrolling removes that course&apos;s progress, attempts, and cards. Prefer{' '}
        <Link href="/srs" className="font-semibold text-atlas-700 hover:underline dark:text-atlas-300">
          spaced repetition
        </Link>{' '}
        to keep what you earned.
      </p>
    </section>
  );
}
