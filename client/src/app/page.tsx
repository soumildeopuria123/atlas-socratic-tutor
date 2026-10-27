'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError, get, post } from '@/lib/api';
import type { Course, CourseModule, DashboardData } from '@/lib/types';
import { useCredits } from '@/components/CreditsProvider';
import SkillTreeView from '@/components/SkillTreeView';
import ProgressTracker from '@/components/ProgressTracker';
import CreditTracker from '@/components/CreditTracker';
import CourseManager from '@/components/CourseManager';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Layers,
  Loader,
  RotateCcw,
  Sparkles,
  Timer,
  Trophy,
  X,
  Zap,
} from '@/components/icons';

function Ring({ value, size = 44 }: { value: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - Math.min(1, Math.max(0, value)) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth="4"
        className="stroke-ink-200 dark:stroke-ink-800"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="stroke-atlas-500 transition-all duration-500"
      />
    </svg>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Zap;
}) {
  return (
    <div className="panel flex items-center gap-3 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
        <p className="text-lg font-bold leading-tight tabular-nums text-ink-900 dark:text-white">{value}</p>
        <p className="truncate text-[10.5px] text-ink-400">{hint}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { setCredits } = useCredits();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [catalog, setCatalog] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [progress, courses] = await Promise.all([
        get<DashboardData>('/progress'),
        get<{ courses: Course[] }>('/courses'),
      ]);
      setDashboard(progress);
      setCatalog(courses.courses);
      setCredits(progress.credits);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace('/login?next=/');
        return;
      }
      setError(caught instanceof ApiError ? caught.message : 'Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, [router, setCredits]);

  useEffect(() => {
    void load();
  }, [load]);

  const nextUp = useMemo(() => {
    if (!dashboard) return null;
    for (const course of dashboard.courses) {
      const module = course.modules.find(
        (item) => item.status === 'UNLOCKED' || item.status === 'IN_PROGRESS',
      );
      if (module) return { course, module };
    }
    return null;
  }, [dashboard]);

  function applyDashboard(data: DashboardData) {
    setDashboard(data);
    setCredits(data.credits);
  }

  function study(course: Course, module: CourseModule) {
    router.push(`/chat?course=${course.slug}&layer=${module.layer}`);
  }

  async function assess(course: Course, module: CourseModule, retest: boolean) {
    setStarting(true);
    setError(null);
    try {
      const data = await post<{ attempt: { id: string }; credits: number }>('/assessment/start', {
        courseSlug: course.slug,
        layer: module.layer,
        retest,
      });
      setCredits(data.credits);
      router.push(`/assessment?attempt=${data.attempt.id}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not start the assessment.');
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[calc(100vh-4rem)] place-items-center">
        <div className="flex items-center gap-2 text-sm font-medium text-ink-400">
          <Loader className="h-4 w-4 animate-spin" /> Assembling your ladder…
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <div className="panel p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" />
          <h1 className="mt-3 text-lg font-semibold text-ink-900 dark:text-white">Dashboard unavailable</h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
            {error ?? 'The API did not respond. Check that the server is running.'}
          </p>
          <button type="button" onClick={load} className="btn-primary mt-5">
            <RotateCcw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const { stats, courses } = dashboard;
  const completion = stats.totalModules ? stats.passedModules / stats.totalModules : 0;
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {error ? (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Hero */}
      <section className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-title mb-1.5">
            {greeting} · @{dashboard.user.username}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
            Your learning ladder
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-500 dark:text-ink-400">
            {stats.passedModules > 0
              ? `${stats.passedModules} layer${stats.passedModules === 1 ? '' : 's'} passed · ${Math.round(
                  completion * 100,
                )}% of your enrolled ladder complete.`
              : 'Pick a course and Atlas opens its foundation layer. No placement test, no skipping.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {nextUp ? (
            <button
              type="button"
              onClick={() => study(nextUp.course, nextUp.module)}
              className="btn-primary"
            >
              <Sparkles className="h-4 w-4" />
              Continue {nextUp.course.title} · L{nextUp.module.layer}
            </button>
          ) : (
            <Link href="/chat" className="btn-primary">
              <Sparkles className="h-4 w-4" /> Open Atlas
            </Link>
          )}
          <Link href="/srs" className="btn-secondary">
            <Layers className="h-4 w-4" /> Review {stats.dueCards ? `(${stats.dueCards})` : ''}
          </Link>
        </div>
      </section>

      {stats.activeRetests > 0 ? (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 dark:border-amber-800/60 dark:bg-amber-950/30">
          <Timer className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              {stats.activeRetests} layer{stats.activeRetests === 1 ? '' : 's'} below the 75% gate
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300/80">
              Each retest is a freshly generated variant — new sampling, new distractors, new order.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const pending = courses
                .flatMap((course) => course.modules.map((module) => ({ course, module })))
                .find((item) => item.module.retestEligible);
              if (pending) void assess(pending.course, pending.module, true);
            }}
            disabled={starting}
            className="rounded-xl border border-amber-400 bg-white px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
          >
            Start retest
          </button>
        </div>
      ) : null}

      {/* Stats */}
      <section className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Layers passed"
          value={`${stats.passedModules}/${stats.totalModules}`}
          hint={`${Math.round(completion * 100)}% of enrolled ladder`}
          icon={Trophy}
        />
        <StatCard
          label="Average score"
          value={stats.averageScore !== null ? `${Math.round(stats.averageScore * 100)}%` : '—'}
          hint="Best score per layer"
          icon={Brain}
        />
        <StatCard
          label="Cards due"
          value={String(stats.dueCards)}
          hint="SM-2 scheduled reviews"
          icon={Layers}
        />
        <StatCard
          label="Credits"
          value={String(dashboard.credits)}
          hint="AI generations & code runs"
          icon={Zap}
        />
      </section>

      {/* Enrolled courses */}
      <section className="mb-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-ink-900 dark:text-white">
            Enrolled courses
          </h2>
          <span className="text-[11px] font-medium text-ink-400">{courses.length} active</span>
        </div>

        {courses.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => {
              const passed = course.modules.filter((module) => module.status === 'PASSED').length;
              const ratio = course.layerCount ? passed / course.layerCount : 0;
              const actionable = course.modules.find(
                (module) => module.status === 'UNLOCKED' || module.status === 'IN_PROGRESS',
              );
              return (
                <article key={course.id} className="panel p-5">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Ring value={ratio} />
                      <span className="absolute inset-0 grid place-items-center text-[10px] font-bold text-ink-700 dark:text-ink-200">
                        {Math.round(ratio * 100)}%
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[15px] font-semibold text-ink-900 dark:text-white">
                        {course.title}
                      </h3>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
                        {course.discipline} · {passed}/{course.layerCount} layers
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-ink-500 dark:text-ink-400">
                    {course.summary}
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    {actionable ? (
                      <>
                        <button
                          type="button"
                          onClick={() => study(course, actionable)}
                          className="btn-secondary flex-1 py-2 text-xs"
                        >
                          <BookOpen className="h-3.5 w-3.5" /> Study L{actionable.layer}
                        </button>
                        <button
                          type="button"
                          onClick={() => assess(course, actionable, actionable.retestEligible)}
                          disabled={starting}
                          className="btn-primary flex-1 py-2 text-xs"
                        >
                          {actionable.retestEligible ? 'Retest' : 'Assess'}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex w-full items-center justify-between rounded-xl bg-atlas-50 px-3 py-2 text-xs font-semibold text-atlas-700 dark:bg-atlas-900/30 dark:text-atlas-300">
                        <span className="inline-flex items-center gap-1.5">
                          <Trophy className="h-3.5 w-3.5" /> Course complete
                        </span>
                        <Link href="/srs" className="underline">
                          Review
                        </Link>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="panel flex flex-col items-center justify-center p-10 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-atlas-50 text-atlas-600 dark:bg-atlas-900/30 dark:text-atlas-400">
              <BookOpen className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-base font-semibold text-ink-900 dark:text-white">No enrollments yet</h3>
            <p className="mt-1 max-w-sm text-sm text-ink-500 dark:text-ink-400">
              Choose a course below. Atlas starts every learner at Layer 1 — even if you think you know the
              material.
            </p>
            <a href="#catalogue" className="btn-primary mt-4">
              Browse the catalogue <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}
      </section>

      {/* Analytics + credits */}
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {courses.length ? (
            <SkillTreeView
              courses={courses}
              onStudy={study}
              onAssess={assess}
              busy={starting}
            />
          ) : null}

          {courses.length ? (
            <ProgressTracker
              courses={courses}
              onDashboard={applyDashboard}
              onStudy={study}
              onAssess={assess}
            />
          ) : null}

          <section className="panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-900 dark:text-white">Recent attempts</h2>
              <span className="text-[11px] text-ink-400">last 8</span>
            </div>
            {dashboard.recentAttempts.length ? (
              <ul className="divide-y divide-ink-200/70 dark:divide-ink-800">
                {dashboard.recentAttempts.map((attempt) => (
                  <li key={attempt.id} className="flex items-center gap-3 py-2.5 text-[12.5px]">
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-white ${
                        attempt.passed ? 'bg-atlas-600' : 'bg-rose-500'
                      }`}
                    >
                      {attempt.passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink-800 dark:text-ink-100">
                        {attempt.courseTitle} · L{attempt.layer} {attempt.title}
                      </p>
                      <p className="text-[10.5px] text-ink-400">
                        {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : '—'}
                        {attempt.flagged ? ' · integrity flagged' : ''}
                      </p>
                    </div>
                    <span className="font-mono font-semibold tabular-nums text-ink-600 dark:text-ink-300">
                      {attempt.percent}%
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-xs text-ink-400">
                No graded attempts yet. Your first assessment is three credits away.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <CreditTracker credits={dashboard.credits} dueCards={stats.dueCards} onCredits={setCredits} />

          <section className="panel p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-white">
              <Layers className="h-4 w-4 text-ink-500 dark:text-ink-400" /> Review queue
            </h2>
            <p className="mt-2 text-[12px] leading-relaxed text-ink-500 dark:text-ink-400">
              {stats.dueCards
                ? `${stats.dueCards} card${stats.dueCards === 1 ? '' : 's'} due now. Reviews earn a credit each, up to five a day.`
                : 'Nothing due. Passing an assessment seeds the next batch automatically.'}
            </p>
            <Link href="/srs" className="btn-secondary mt-3 w-full py-2 text-xs">
              {stats.dueCards ? 'Start review' : 'Open deck'} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        </aside>
      </div>

      <div id="catalogue" className="mt-10">
        <CourseManager
          courses={catalog}
          onOpen={(course) => router.push(`/chat?course=${course.slug}`)}
          onChanged={async () => {
            await load();
          }}
        />
      </div>
    </div>
  );
}
