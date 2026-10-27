'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, post } from '@/lib/api';
import type { Attempt, SubmitResult } from '@/lib/types';
import CodeMathBlock from './CodeMathBlock';
import { useCredits } from './CreditsProvider';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  Loader,
  RotateCcw,
  ShieldCheck,
  Trophy,
  X,
} from './icons';

interface Props {
  initialAttempt: Attempt;
  onExit?: () => void;
}

const formatClock = (seconds: number) => {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
};

export default function AssessmentView({ initialAttempt, onExit }: Props) {
  const router = useRouter();
  const { setCredits } = useCredits();
  const [attempt, setAttempt] = useState<Attempt>(initialAttempt);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.round((new Date(initialAttempt.endsAt).getTime() - Date.now()) / 1000)),
  );
  const [entered, setEntered] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [infractions, setInfractions] = useState(initialAttempt.infractions ?? 0);
  const [flagged, setFlagged] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retesting, setRetesting] = useState(false);

  const submittedRef = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const lastEventRef = useRef<Record<string, number>>({});

  const question = attempt.questions[index];
  const answeredCount = Object.keys(answers).length;

  const submit = useCallback(
    async (terminated = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      setError(null);

      const payload = attempt.questions.map((_, questionIndex) =>
        Number.isInteger(answersRef.current[questionIndex]) ? answersRef.current[questionIndex] : null,
      );

      try {
        const data = await post<SubmitResult>(`/assessment/${attempt.id}/submit`, {
          answers: payload,
          terminated,
        });
        setResult(data);
        setCredits(data.credits);
        if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      } catch (caught) {
        submittedRef.current = false;
        setError(caught instanceof ApiError ? caught.message : 'Submission failed. Your answers are still here — try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [attempt.id, attempt.questions, setCredits],
  );

  const reportEvent = useCallback(
    async (type: string) => {
      if (submittedRef.current) return;
      const now = Date.now();
      if (now - (lastEventRef.current[type] ?? 0) < 2000) return;
      lastEventRef.current[type] = now;
      try {
        const data = await post<{
          infractions: number;
          flagged: boolean;
          terminate: boolean;
        }>(`/assessment/${attempt.id}/event`, { type });
        setInfractions(data.infractions);
        setFlagged(data.flagged);
        if (data.terminate) void submit(true);
      } catch {
        /* never block the exam on telemetry */
      }
    },
    [attempt.id, submit],
  );

  // Timer: authoritative endsAt comes from the server.
  useEffect(() => {
    if (result) return;
    const tick = () => {
      const remaining = Math.round((new Date(attempt.endsAt).getTime() - Date.now()) / 1000);
      setSecondsLeft(remaining);
      if (remaining <= 0) void submit(false);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [attempt.endsAt, result, submit]);

  // Integrity monitoring while secure mode is active.
  useEffect(() => {
    if (!entered || result) return;

    const onVisibility = () => {
      if (document.hidden) void reportEvent('visibility_hidden');
    };
    const onBlur = () => void reportEvent('window_blur');
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') void reportEvent('escape_pressed');
    };
    const onCopy = () => void reportEvent('copy_attempt');
    const onContext = () => void reportEvent('context_menu');
    const onFullscreen = () => {
      const active = Boolean(document.fullscreenElement);
      setFullscreen(active);
      if (!active) void reportEvent('fullscreen_exit');
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('keydown', onKey);
    document.addEventListener('copy', onCopy);
    document.addEventListener('contextmenu', onContext);
    document.addEventListener('fullscreenchange', onFullscreen);

    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!submittedRef.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('contextmenu', onContext);
      document.removeEventListener('fullscreenchange', onFullscreen);
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, [entered, result, reportEvent]);

  async function enterSecureMode() {
    setEntered(true);
    try {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      setFullscreen(true);
    } catch {
      // Browser refused (needs a gesture or does not support it): continue with warnings.
      setFullscreen(false);
    }
  }

  async function startRetest() {
    setRetesting(true);
    setError(null);
    try {
      const data = await post<{ attempt: Attempt; credits: number }>('/assessment/start', {
        courseSlug: attempt.courseSlug,
        layer: attempt.layer,
        retest: true,
      });
      setAttempt(data.attempt);
      setCredits(data.credits);
      setAnswers({});
      setIndex(0);
      setResult(null);
      setEntered(false);
      setInfractions(0);
      setFlagged(false);
      setSecondsLeft(
        Math.max(0, Math.round((new Date(data.attempt.endsAt).getTime() - Date.now()) / 1000)),
      );
      submittedRef.current = false;
      router.replace(`/assessment?attempt=${data.attempt.id}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not start a retest.');
    } finally {
      setRetesting(false);
    }
  }

  const grade = result?.result;
  const progressRatio = useMemo(
    () => (attempt.totalQuestions ? answeredCount / attempt.totalQuestions : 0),
    [answeredCount, attempt.totalQuestions],
  );

  if (grade && result) {
    return (
      <div className="min-h-screen bg-ink-50 px-4 py-10 dark:bg-ink-950">
        <div className="mx-auto max-w-3xl">
          <div className="panel overflow-hidden">
            <div
              className={`border-b px-6 py-8 text-center ${
                result.passed
                  ? 'border-atlas-200 bg-gradient-to-b from-atlas-50 to-white dark:border-atlas-900 dark:from-atlas-900/30 dark:to-ink-900'
                  : 'border-rose-200 bg-gradient-to-b from-rose-50 to-white dark:border-rose-900/60 dark:from-rose-950/30 dark:to-ink-900'
              }`}
            >
              <div
                className="mx-auto grid h-28 w-28 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(${
                    result.passed ? '#10b981' : '#f43f5e'
                  } ${grade.percent * 3.6}deg, rgba(148,163,184,0.22) 0deg)`,
                }}
              >
                <div className="grid h-24 w-24 place-items-center rounded-full bg-white dark:bg-ink-900">
                  <div>
                    <p className="text-3xl font-black tabular-nums text-ink-900 dark:text-white">{grade.percent}%</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
                      {grade.correct}/{grade.total} correct
                    </p>
                  </div>
                </div>
              </div>

              <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
                {result.passed ? 'Layer cleared' : 'Not this time'}
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-600 dark:text-ink-300">
                {result.passed
                  ? result.courseComplete
                    ? `You completed ${attempt.courseTitle}. The full deck is now in your review queue.`
                    : `Next unlock: Layer ${result.nextLayer?.layer} — ${result.nextLayer?.title}.`
                  : result.message ??
                    `The pass mark is 75%. Your retest variant is ready and covers the concepts below.`}
              </p>
              {result.terminated ? (
                <p className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-200">
                  <ShieldCheck className="h-3.5 w-3.5" /> Ended by exam-integrity enforcement
                </p>
              ) : null}
            </div>

            <div className="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                Question review
              </h2>
              <ul className="mt-3 space-y-3">
                {grade.review.map((item, questionIndex) => (
                  <li
                    key={item.id}
                    className={`rounded-xl border p-4 ${
                      item.isCorrect
                        ? 'border-atlas-200 bg-atlas-50/40 dark:border-atlas-900/60 dark:bg-atlas-950/20'
                        : 'border-rose-200 bg-rose-50/40 dark:border-rose-900/60 dark:bg-rose-950/20'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-white ${
                          item.isCorrect ? 'bg-atlas-600' : 'bg-rose-500'
                        }`}
                      >
                        {item.isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-ink-900 dark:text-ink-100">
                          Q{questionIndex + 1}. {item.prompt.replace(/\*\*/g, '')}
                        </p>
                        <p className="mt-1.5 text-xs text-ink-600 dark:text-ink-300">
                          Correct: <strong>{item.options[item.answer]}</strong>
                          {item.given !== null && !item.isCorrect ? (
                            <>
                              {' · '}You chose: <span className="line-through">{item.options[item.given]}</span>
                            </>
                          ) : null}
                        </p>
                        <p className="mt-1 text-[11.5px] leading-relaxed text-ink-500 dark:text-ink-400">
                          {item.explanation}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {result.remediation ? (
                <div className="mt-6 rounded-xl border border-amber-300/70 bg-amber-50/60 p-5 dark:border-amber-800/60 dark:bg-amber-950/20">
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                    <RotateCcw className="h-4 w-4" /> Atlas remediation
                  </h2>
                  <div className="mt-3">
                    <CodeMathBlock markdown={result.remediation.markdown} />
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => (onExit ? onExit() : router.push('/'))}
                  className="btn-secondary"
                >
                  Back to dashboard
                </button>
                {result.passed ? (
                  <button
                    type="button"
                    onClick={() =>
                      result.nextLayer
                        ? router.push(`/chat?course=${attempt.courseSlug}&layer=${result.nextLayer.layer}`)
                        : router.push('/srs')
                    }
                    className="btn-primary"
                  >
                    {result.nextLayer ? `Start layer ${result.nextLayer.layer}` : 'Review your deck'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button type="button" onClick={startRetest} disabled={retesting} className="btn-primary">
                    {retesting ? <Loader className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                    Retest · new variant
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-ink-950">
      <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/95 backdrop-blur dark:border-ink-800 dark:bg-ink-950/95">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink-900 text-white dark:bg-ink-800">
            <ShieldCheck className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
              {attempt.courseTitle} · Layer {attempt.layer}
            </p>
            <p className="truncate text-[11px] text-ink-500 dark:text-ink-400">
              {attempt.title} · secure assessment · pass mark 75%
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Answered</p>
              <p className="text-xs font-semibold tabular-nums text-ink-700 dark:text-ink-200">
                {answeredCount}/{attempt.totalQuestions}
              </p>
            </div>
            <div
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 font-mono text-sm font-bold tabular-nums ${
                secondsLeft <= 300
                  ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                  : 'border-ink-200 bg-ink-50 text-ink-800 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100'
              }`}
              aria-live="polite"
            >
              <Clock className="h-4 w-4" />
              {formatClock(secondsLeft)}
            </div>
            <button type="button" onClick={() => setConfirming(true)} className="btn-primary px-3 py-2 text-xs">
              Submit
            </button>
          </div>
        </div>

        <div className="h-0.5 w-full bg-ink-200 dark:bg-ink-800">
          <div
            className="h-full bg-gradient-to-r from-atlas-400 to-atlas-600 transition-all"
            style={{ width: `${progressRatio * 100}%` }}
          />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {(flagged || !fullscreen) && entered ? (
          <div
            className={`mb-4 flex flex-wrap items-center gap-2 rounded-xl border px-4 py-2.5 text-xs ${
              flagged
                ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
                : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
            }`}
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {flagged ? (
              <span>
                Integrity flagged — {infractions} infraction{infractions === 1 ? '' : 's'} recorded. Five ends the
                attempt.
              </span>
            ) : (
              <span>
                Secure mode is not active. Return to full screen to avoid recorded infractions.
              </span>
            )}
            <button
              type="button"
              onClick={enterSecureMode}
              className="ml-auto rounded-lg border border-current px-2 py-1 font-semibold"
            >
              Re-enter full screen
            </button>
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
          <main className="panel p-6">
            <div className="flex items-center justify-between">
              <span className="chip-neutral">
                Question {index + 1} of {attempt.totalQuestions}
              </span>
              <span className="text-[11px] font-medium text-ink-400">{attempt.tier.toLowerCase()}</span>
            </div>

            <div className="mt-4">
              <CodeMathBlock markdown={question?.prompt ?? ''} />
            </div>

            <div className="mt-5 space-y-2.5">
              {(question?.options ?? []).map((option, optionIndex) => {
                const selected = answers[index] === optionIndex;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAnswers((current) => ({ ...current, [index]: optionIndex }))}
                    className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                      selected
                        ? 'border-atlas-500 bg-atlas-50 text-ink-900 ring-2 ring-atlas-500/20 dark:border-atlas-500 dark:bg-atlas-900/30 dark:text-white'
                        : 'border-ink-200 bg-white text-ink-700 hover:border-atlas-300 hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:border-atlas-700'
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold ${
                        selected
                          ? 'border-atlas-500 bg-atlas-500 text-white'
                          : 'border-ink-300 text-ink-500 dark:border-ink-600 dark:text-ink-400'
                      }`}
                    >
                      {selected ? <Check className="h-3.5 w-3.5" /> : String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIndex((value) => Math.max(0, value - 1))}
                disabled={index === 0}
                className="btn-secondary"
              >
                Previous
              </button>
              {index === attempt.totalQuestions - 1 ? (
                <button type="button" onClick={() => setConfirming(true)} className="btn-primary">
                  Review & submit <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIndex((value) => Math.min(attempt.totalQuestions - 1, value + 1))}
                  className="btn-primary"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {error ? (
              <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
                <AlertTriangle className="h-3.5 w-3.5" /> {error}
              </p>
            ) : null}
          </main>

          <aside className="space-y-3">
            <div className="panel p-4">
              <p className="section-title mb-2.5">Question map</p>
              <div className="grid grid-cols-4 gap-1.5 lg:grid-cols-4">
                {attempt.questions.map((_, questionIndex) => {
                  const answered = Number.isInteger(answers[questionIndex]);
                  const current = questionIndex === index;
                  return (
                    <button
                      key={questionIndex}
                      type="button"
                      onClick={() => setIndex(questionIndex)}
                      aria-label={`Go to question ${questionIndex + 1}`}
                      className={`grid h-9 place-items-center rounded-lg border text-xs font-semibold tabular-nums transition ${
                        current
                          ? 'border-ink-900 bg-ink-900 text-white dark:border-atlas-500 dark:bg-atlas-600'
                          : answered
                            ? 'border-atlas-300 bg-atlas-50 text-atlas-700 dark:border-atlas-800 dark:bg-atlas-900/30 dark:text-atlas-300'
                            : 'border-ink-200 bg-white text-ink-500 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-400'
                      }`}
                    >
                      {questionIndex + 1}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-ink-400 dark:text-ink-500">
                {answeredCount === attempt.totalQuestions
                  ? 'All questions answered. You can change any answer before submitting.'
                  : `${attempt.totalQuestions - answeredCount} unanswered. Unanswered questions score zero.`}
              </p>
            </div>

            <div className="panel p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Integrity
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
                Full screen, tab switches, and clipboard use are logged. Three infractions flag the paper; five end
                it.
              </p>
              <p className="mt-2 font-mono text-xs font-semibold text-ink-700 dark:text-ink-200">
                {infractions} / 5 recorded
              </p>
            </div>
          </aside>
        </div>
      </div>

      {!entered ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-ink-950/80 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-2xl border border-ink-700 bg-ink-900 p-6 text-white shadow-2xl">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-atlas-600">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold">Secure exam mode</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-300">
              Atlas locks the interface into full screen and records leaving it. The timer is already running —{' '}
              <strong className="text-white">{formatClock(secondsLeft)}</strong> remain.
            </p>
            <ul className="mt-3 space-y-1.5 text-[12px] text-ink-400">
              <li>• 75% is required to unlock the next layer</li>
              <li>• Unanswered questions score zero</li>
              <li>• Five integrity infractions end the attempt</li>
            </ul>
            <button type="button" onClick={enterSecureMode} className="btn-primary mt-5 w-full">
              <ShieldCheck className="h-4 w-4" /> Enter full screen & begin
            </button>
            <button
              type="button"
              onClick={() => (onExit ? onExit() : router.push('/'))}
              className="mt-2 w-full rounded-xl px-4 py-2 text-xs font-medium text-ink-400 hover:text-white"
            >
              Abandon this attempt
            </button>
          </div>
        </div>
      ) : null}

      {confirming ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/70 p-4 backdrop-blur">
          <div className="w-full max-w-sm rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900">
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900 dark:text-white">
              <Trophy className="h-4 w-4 text-atlas-600 dark:text-atlas-400" /> Submit for grading?
            </h2>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
              {answeredCount} of {attempt.totalQuestions} answered. Grading is final for this variant; a failure
              unlocks a fresh retest.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirming(false)} className="btn-secondary">
                Keep working
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  void submit(false);
                }}
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Submit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
