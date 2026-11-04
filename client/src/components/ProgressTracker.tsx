'use client';

import { useState } from 'react';
import { ApiError, del, post } from '@/lib/api';
import type { Course, CourseModule, DashboardData } from '@/lib/types';
import { useCredits } from './CreditsProvider';
import {
  AlertTriangle,
  Check,
  Loader,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  Trash,
  X,
} from './icons';

interface Props {
  courses: Course[];
  onDashboard: (data: DashboardData) => void;
  onStudy: (course: Course, module: CourseModule) => void;
  onAssess: (course: Course, module: CourseModule, retest: boolean) => void;
}

export default function ProgressTracker({ courses, onDashboard, onStudy, onAssess }: Props) {
  const { setCredits } = useCredits();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetText, setResetText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const retests = courses.flatMap((course) =>
    course.modules.filter((module) => module.retestEligible).map((module) => ({ course, module })),
  );

  function apply(data: DashboardData) {
    onDashboard(data);
    setCredits(data.credits);
  }

  async function removeModule(module: CourseModule) {
    setBusy(module.id);
    setError(null);
    try {
      const data = await del<DashboardData>(`/progress/module/${module.id}`);
      apply(data);
      setConfirmDelete(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not delete that module.');
    } finally {
      setBusy(null);
    }
  }

  async function resetAll() {
    if (resetText !== 'RESET') return;
    setBusy('reset');
    setError(null);
    try {
      const data = await post<DashboardData>('/progress/reset', { confirm: 'RESET' });
      apply(data);
      setResetOpen(false);
      setResetText('');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not reset progress.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="panel p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-white">
            <RotateCcw className="h-4 w-4 text-ink-500 dark:text-ink-400" />
            Progress analytics
          </h2>
          <p className="mt-1 text-[11px] text-ink-500 dark:text-ink-400">
            Delete a single layer to revisit it, or reset everything. Deleting a prerequisite relocks what
            depended on it.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="btn-danger px-3 py-2 text-xs"
        >
          <Trash className="h-3.5 w-3.5" /> Full reset
        </button>
      </div>

      {retests.length ? (
        <div className="mb-4 rounded-xl border border-amber-300/70 bg-amber-50 p-3.5 dark:border-amber-800/60 dark:bg-amber-950/30">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
            <Timer className="h-3.5 w-3.5" /> Retests unlocked
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {retests.map(({ course, module }) => (
              <button
                key={module.id}
                type="button"
                onClick={() => onAssess(course, module, true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/70 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
              >
                {course.title} · L{module.layer} — new variant
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertTriangle className="h-3.5 w-3.5" /> {error}
        </p>
      ) : null}

      <div className="space-y-5">
        {courses.map((course) => (
          <div key={course.slug}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-ink-800 dark:text-ink-100">{course.title}</h3>
              <span className="text-[11px] font-medium text-ink-400">
                {course.modules.filter((module) => module.status === 'PASSED').length}/{course.layerCount} passed
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-ink-200 dark:border-ink-800">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-ink-50 text-[10px] uppercase tracking-wider text-ink-500 dark:bg-ink-900/60 dark:text-ink-400">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Layer</th>
                    <th className="hidden px-3 py-2 font-semibold sm:table-cell">Best</th>
                    <th className="hidden px-3 py-2 font-semibold sm:table-cell">Tries</th>
                    <th className="px-3 py-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200/80 dark:divide-ink-800">
                  {course.modules.map((module) => (
                    <tr key={module.id} className="bg-white/60 dark:bg-ink-900/30">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-ink-400">L{module.layer}</span>
                          <span className="font-medium text-ink-800 dark:text-ink-200">{module.title}</span>
                          {module.status === 'PASSED' ? (
                            <Check className="h-3 w-3 text-atlas-600 dark:text-atlas-400" />
                          ) : null}
                        </div>
                      </td>
                      <td className="hidden px-3 py-2.5 tabular-nums text-ink-600 sm:table-cell dark:text-ink-300">
                        {module.bestScore !== null ? `${Math.round(module.bestScore * 100)}%` : '—'}
                      </td>
                      <td className="hidden px-3 py-2.5 tabular-nums text-ink-500 sm:table-cell dark:text-ink-400">
                        {module.attempts}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          {module.status !== 'LOCKED' ? (
                            <button
                              type="button"
                              onClick={() => onStudy(course, module)}
                              title="Study with Atlas"
                              className="rounded-lg p-1.5 text-ink-400 hover:bg-atlas-50 hover:text-atlas-700 dark:hover:bg-atlas-900/30 dark:hover:text-atlas-300"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                          {module.status !== 'LOCKED' && module.status !== 'PASSED' ? (
                            <button
                              type="button"
                              onClick={() => onAssess(course, module, module.retestEligible)}
                              title={module.retestEligible ? 'Retest (new variant)' : 'Start assessment'}
                              className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-800 dark:hover:bg-ink-800 dark:hover:text-ink-100"
                            >
                              {module.retestEligible ? <Timer className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(module.id)}
                            title="Delete this module's progress"
                            className="rounded-lg p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {!courses.length ? (
          <p className="py-6 text-center text-sm text-ink-500 dark:text-ink-400">
            No enrolled courses yet — pick one from the catalogue below.
          </p>
        ) : null}
      </div>

      {confirmDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/50 p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-ink-900 dark:text-white">Delete this module&apos;s progress?</h3>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
              Its attempts, best score, and flashcards will be removed, and any later layer that depended on it
              will lock again. Credits already spent are not refunded.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)} className="btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const module = courses.flatMap((course) => course.modules).find((item) => item.id === confirmDelete);
                  if (module) void removeModule(module);
                }}
                disabled={busy === confirmDelete}
                className="btn-danger"
              >
                {busy === confirmDelete ? <Loader className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {resetOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/50 p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-6">
            <h3 className="flex items-center gap-2 text-base font-semibold text-ink-900 dark:text-white">
              <AlertTriangle className="h-4 w-4 text-rose-500" /> Reset all progress
            </h3>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
              Every attempt, score, and flashcard across all courses will be deleted and every ladder relocked to
              Layer 1. Enrollments and credits are kept. This cannot be undone.
            </p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
              Type RESET to confirm
            </label>
            <input
              value={resetText}
              onChange={(event) => setResetText(event.target.value)}
              className="input mt-1.5"
              placeholder="RESET"
              autoFocus
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setResetOpen(false);
                  setResetText('');
                }}
                className="btn-secondary"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
              <button
                type="button"
                onClick={resetAll}
                disabled={resetText !== 'RESET' || busy === 'reset'}
                className="btn-danger"
              >
                {busy === 'reset' ? <Loader className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Reset everything
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
