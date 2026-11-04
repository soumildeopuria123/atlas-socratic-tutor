'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError, get, post } from '@/lib/api';
import type { Flashcard, SrsPayload } from '@/lib/types';
import { useCredits } from '@/components/CreditsProvider';
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Check,
  ChevronRight,
  Clock,
  Flame,
  Layers,
  Loader,
  RotateCcw,
} from '@/components/icons';

const GRADES = [
  { quality: 0, label: 'Again', hint: 'no recall', tone: 'rose' },
  { quality: 3, label: 'Hard', hint: 'barely', tone: 'amber' },
  { quality: 4, label: 'Good', hint: 'solid', tone: 'atlas' },
  { quality: 5, label: 'Easy', hint: 'instant', tone: 'ink' },
] as const;

const TONE: Record<string, string> = {
  rose: 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200',
  amber:
    'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200',
  atlas:
    'border-atlas-300 bg-atlas-50 text-atlas-800 hover:bg-atlas-100 dark:border-atlas-800 dark:bg-atlas-900/30 dark:text-atlas-200',
  ink: 'border-ink-300 bg-white text-ink-700 hover:bg-ink-50 dark:border-ink-600 dark:bg-ink-800 dark:text-ink-100',
};

export default function SrsPage() {
  const router = useRouter();
  const { setCredits } = useCredits();
  const [data, setData] = useState<SrsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [pending, setPending] = useState(false);
  const [lastInterval, setLastInterval] = useState<string | null>(null);

  useEffect(() => {
    get<SrsPayload>('/srs')
      .then(setData)
      .catch((caught) => {
        if (caught instanceof ApiError && caught.status === 401) {
          router.replace('/login?next=/srs');
          return;
        }
        setError(caught instanceof ApiError ? caught.message : 'Could not load your deck.');
      });
  }, [router]);

  const card: Flashcard | undefined = data?.due[0];

  async function grade(quality: number) {
    if (!card || pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await post<{
        card: { interval: number; dueAt: string };
        credits: number;
        creditsEarned: number;
      }>(`/srs/${card.id}/review`, { quality });
      setCredits(response.credits);
      setData((current) =>
        current
          ? {
              due: current.due.slice(1),
              stats: {
                ...current.stats,
                due: Math.max(0, current.stats.due - 1),
                upcoming: current.stats.upcoming + 1,
                mastered: quality >= 4 ? current.stats.mastered + 1 : current.stats.mastered,
              },
            }
          : current,
      );
      setReviewed((value) => value + 1);
      setFlipped(false);
      setLastInterval(
        response.card.interval === 1 ? 'tomorrow' : `in ${response.card.interval} days`,
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not record that review.');
    } finally {
      setPending(false);
    }
  }

  // Keyboard: space flips, 1-4 grade.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!card) return;
      if (event.code === 'Space') {
        event.preventDefault();
        setFlipped((value) => !value);
      }
      if (flipped && ['1', '2', '3', '4'].includes(event.key)) {
        const gradeIndex = Number(event.key) - 1;
        void grade(GRADES[gradeIndex].quality);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, flipped, pending]);

  if (error && !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <div className="panel p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" />
          <p className="mt-3 text-sm text-ink-600 dark:text-ink-300">{error}</p>
          <Link href="/" className="btn-primary mt-5">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid min-h-[calc(100vh-4rem)] place-items-center">
        <div className="flex items-center gap-2 text-sm font-medium text-ink-400">
          <Loader className="h-4 w-4 animate-spin" /> Scheduling your deck…
        </div>
      </div>
    );
  }

  const remaining = data.due.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-title mb-1 flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5" /> Spaced repetition · SM-2
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Today&apos;s review</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Passing a layer seeds its concepts as cards. Grades adjust each card&apos;s interval and ease factor.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-center dark:border-ink-700 dark:bg-ink-900">
            <p className="text-lg font-bold tabular-nums text-ink-900 dark:text-white">{remaining}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">due</p>
          </div>
          <div className="rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-center dark:border-ink-700 dark:bg-ink-900">
            <p className="text-lg font-bold tabular-nums text-ink-900 dark:text-white">{data.stats.mastered}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">mastered</p>
          </div>
          <div className="rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-center dark:border-ink-700 dark:bg-ink-900">
            <p className="text-lg font-bold tabular-nums text-ink-900 dark:text-white">{reviewed}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">done</p>
          </div>
        </div>
      </header>

      {error ? (
        <p className="mb-4 flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertTriangle className="h-3.5 w-3.5" /> {error}
        </p>
      ) : null}

      {card ? (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-medium text-ink-500 dark:text-ink-400">
            <span className="chip-neutral">
              <Layers className="h-3 w-3" /> {card.courseTitle}
            </span>
            {card.layer ? (
              <span className="chip-neutral">
                Layer {card.layer} · {card.layerTitle}
              </span>
            ) : null}
            <span className="ml-auto inline-flex items-center gap-1">
              <Flame className="h-3 w-3 text-amber-500" /> {card.repetitions} reps · ease {card.easeFactor.toFixed(2)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setFlipped((value) => !value)}
            className="group relative block w-full text-left"
            aria-label={flipped ? 'Hide answer' : 'Reveal answer'}
          >
            <div className="panel min-h-[19rem] w-full overflow-hidden p-8 transition group-hover:border-atlas-300 dark:group-hover:border-atlas-700">
              <p className="section-title mb-4">{flipped ? 'Answer' : 'Prompt'}</p>
              <p className="text-xl font-semibold leading-snug text-ink-900 dark:text-white">
                {flipped ? card.back : card.front}
              </p>
              {!flipped ? (
                <p className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-400">
                  <Clock className="h-3 w-3" /> Space to flip · 1–4 to grade
                </p>
              ) : (
                <p className="mt-6 text-[11px] font-medium text-ink-400">
                  Rate your recall honestly — the schedule depends on it.
                </p>
              )}
            </div>
          </button>

          {flipped ? (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GRADES.map((gradeOption) => (
                <button
                  key={gradeOption.quality}
                  type="button"
                  onClick={() => grade(gradeOption.quality)}
                  disabled={pending}
                  className={`rounded-xl border px-3 py-3 text-center transition disabled:opacity-50 ${TONE[gradeOption.tone]}`}
                >
                  <span className="block text-sm font-bold">{gradeOption.label}</span>
                  <span className="block text-[10px] font-medium opacity-70">
                    {gradeOption.hint} · q{gradeOption.quality}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <button type="button" onClick={() => setFlipped(true)} className="btn-primary mt-4 w-full">
              Reveal answer <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {lastInterval ? (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-medium text-atlas-700 dark:text-atlas-300">
              <Check className="h-3 w-3" /> Scheduled {lastInterval} · +1 credit
            </p>
          ) : null}
        </>
      ) : (
        <div className="panel p-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-atlas-50 text-atlas-600 dark:bg-atlas-900/30 dark:text-atlas-400">
            <RotateCcw className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-ink-900 dark:text-white">
            {reviewed > 0 ? 'Deck cleared for today' : 'Nothing due right now'}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500 dark:text-ink-400">
            {reviewed > 0
              ? `You reviewed ${reviewed} card${reviewed === 1 ? '' : 's'}. Cards return when their interval expires.`
              : `You have ${data.stats.total} card${data.stats.total === 1 ? '' : 's'} in the deck${
                  data.stats.upcoming ? `, with ${data.stats.upcoming} scheduled ahead` : ''
                }. Pass a layer assessment to seed new ones.`}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/" className="btn-secondary">
              Dashboard
            </Link>
            <Link href="/chat" className="btn-primary">
              Study with Atlas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
