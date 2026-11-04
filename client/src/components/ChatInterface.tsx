'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, get, post } from '@/lib/api';
import type { Checkpoint, Course, LessonPayload, TutorReply } from '@/lib/types';
import { useCredits } from './CreditsProvider';
import CodeMathBlock from './CodeMathBlock';
import CodeSandbox from './CodeSandbox';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Layers,
  Loader,
  Lock,
  Send,
  Sparkles,
  Terminal,
  Zap,
} from './icons';

interface ChatMessage {
  id: string;
  role: 'atlas' | 'user' | 'error';
  markdown: string;
  checkpoint?: Checkpoint;
  meta?: LessonPayload['meta'];
}

interface Props {
  courses: Course[];
}

function CheckpointCard({ checkpoint }: { checkpoint: Checkpoint }) {
  const [picked, setPicked] = useState<number | null>(null);
  const correct = picked === checkpoint.answer;

  return (
    <div className="mt-4 rounded-xl border border-atlas-300/60 bg-atlas-50/60 p-4 dark:border-atlas-800/70 dark:bg-atlas-900/20">
      <p className="mb-3 text-sm font-semibold text-ink-900 dark:text-white">{checkpoint.q}</p>
      <div className="grid gap-2">
        {checkpoint.options.map((option, index) => {
          const isPicked = picked === index;
          const isAnswer = index === checkpoint.answer;
          const reveal = picked !== null;
          return (
            <button
              key={option}
              type="button"
              disabled={reveal}
              onClick={() => setPicked(index)}
              className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition ${
                reveal && isAnswer
                  ? 'border-atlas-500 bg-atlas-100/80 text-atlas-900 dark:border-atlas-500 dark:bg-atlas-900/40 dark:text-atlas-100'
                  : reveal && isPicked
                    ? 'border-rose-400 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200'
                    : 'border-ink-200 bg-white text-ink-700 hover:border-atlas-400 hover:bg-white dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:border-atlas-600'
              }`}
            >
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-current text-[10px] font-bold">
                {reveal && isAnswer ? <Check className="h-3 w-3" /> : String.fromCharCode(65 + index)}
              </span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>
      {picked !== null ? (
        <p className="mt-3 text-xs leading-relaxed text-ink-600 dark:text-ink-300">
          <span className="font-bold">{correct ? 'Correct. ' : 'Not quite. '}</span>
          {checkpoint.why}
        </p>
      ) : (
        <p className="mt-3 text-[11px] text-ink-400 dark:text-ink-500">
          Commit to an answer — the reasoning appears after you choose.
        </p>
      )}
    </div>
  );
}

export default function ChatInterface({ courses }: Props) {
  const { credits, setCredits } = useCredits();
  const [activeSlug, setActiveSlug] = useState(() => {
    if (typeof window === 'undefined') return courses[0]?.slug ?? '';
    const requested = new URLSearchParams(window.location.search).get('course');
    return requested && courses.some((course) => course.slug === requested)
      ? requested
      : courses[0]?.slug ?? '';
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [overviewLoaded, setOverviewLoaded] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const deepLink = useRef<{ slug: string; layer: number | null } | null>(null);
  const loadingOverview = useRef<string | null>(null);

  const activeCourse = useMemo(
    () => courses.find((course) => course.slug === activeSlug) ?? courses[0],
    [courses, activeSlug],
  );

  // Never offer to teach a locked layer: the API would refuse it, and the
  // suggestion would contradict the ladder the learner can see.
  const visibleFollowUps = useMemo(
    () =>
      followUps.filter((suggestion) => {
        const match = suggestion.match(/teach me layer\s*(\d+)/i);
        if (!match) return true;
        const target = activeCourse?.modules.find((module) => module.layer === Number(match[1]));
        return target ? target.status !== 'LOCKED' : true;
      }),
    [followUps, activeCourse],
  );

  const nextLayer = useMemo(() => {
    if (!activeCourse) return null;
    return (
      activeCourse.modules.find((module) => module.status === 'UNLOCKED' || module.status === 'IN_PROGRESS') ??
      activeCourse.modules.find((module) => module.status === 'PASSED')
    );
  }, [activeCourse]);

  const push = useCallback((message: Omit<ChatMessage, 'id'>) => {
    setMessages((current) => [
      ...current,
      { ...message, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
    ]);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
  }, [messages, pending]);

  const loadOverview = useCallback(
    async (slug: string) => {
      try {
        const data = await get<{ overview: LessonPayload }>(`/tutor/course/${slug}`);
        push({
          role: 'atlas',
          markdown: data.overview.markdown,
          meta: data.overview.meta,
        });
        setOverviewLoaded(slug);
        loadingOverview.current = null;
        setFollowUps(['Teach me layer 1', 'Quiz me on layer 1', 'Why this order?']);
        if (deepLink.current?.slug === slug) {
          const layer = deepLink.current.layer;
          deepLink.current = null;
          if (layer) setTimeout(() => void teach(slug, layer), 200);
        }
      } catch (caught) {
        loadingOverview.current = null;
        push({
          role: 'error',
          markdown: caught instanceof ApiError ? caught.message : 'Could not load this course.',
        });
      }
    },
    [push],
  );

  useEffect(() => {
    if (!activeCourse || overviewLoaded === activeCourse.slug) return;
    // Strict mode (and any fast remount) would otherwise fire two overviews and
    // render the course map twice; dedupe the in-flight request by slug.
    if (loadingOverview.current === activeCourse.slug) return;
    loadingOverview.current = activeCourse.slug;
    setMessages([]);
    void loadOverview(activeCourse.slug);
  }, [activeCourse, overviewLoaded, loadOverview]);

  // Deep link from the dashboard: /chat?course=slug&layer=2
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('course');
    const layer = Number(params.get('layer'));
    if (!slug || !courses.some((course) => course.slug === slug)) return;
    // The slug is already the initial state; only the layer needs remembering so
    // it can fire once the course overview has rendered.
    deepLink.current = { slug, layer: Number.isInteger(layer) && layer > 0 ? layer : null };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses.length]);

  async function teach(slug: string, layer: number, mode: 'lesson' | 'remediation' = 'lesson') {
    if (pending) return;
    setPending(true);
    push({
      role: 'user',
      markdown: mode === 'remediation' ? `Re-teach layer ${layer}, slowly.` : `Teach me layer ${layer}.`,
    });
    try {
      const data = await post<{
        lesson: LessonPayload;
        credits: number;
        cost: number;
        followUps: string[];
      }>('/tutor/lesson', { courseSlug: slug, layer, mode });
      push({ role: 'atlas', markdown: data.lesson.markdown, checkpoint: data.lesson.checkpoint, meta: data.lesson.meta });
      setCredits(data.credits);
      setFollowUps(data.followUps ?? []);
    } catch (caught) {
      push({
        role: 'error',
        markdown:
          caught instanceof ApiError
            ? caught.message
            : 'Atlas could not generate that lesson. The server may be offline.',
      });
    } finally {
      setPending(false);
    }
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || pending) return;
    setPending(true);
    setInput('');
    push({ role: 'user', markdown: message });
    try {
      const data = await post<{ reply: TutorReply; credits: number; followUps: string[] }>(
        '/tutor/message',
        { message },
      );
      push({
        role: 'atlas',
        markdown: data.reply.markdown,
        checkpoint: data.reply.checkpoint,
        meta: data.reply.meta as LessonPayload['meta'],
      });
      setCredits(data.credits);
      setFollowUps(data.followUps ?? []);
    } catch (caught) {
      push({
        role: 'error',
        markdown: caught instanceof ApiError ? caught.message : 'Atlas did not receive that message.',
      });
    } finally {
      setPending(false);
      composerRef.current?.focus();
    }
  }

  function switchCourse(slug: string) {
    setActiveSlug(slug);
    setOverviewLoaded('');
    setMessages([]);
    setFollowUps([]);
  }

  if (!activeCourse) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="panel p-10">
          <BookOpen className="mx-auto h-10 w-10 text-ink-400" />
          <h2 className="mt-4 text-lg font-semibold text-ink-900 dark:text-white">No courses yet</h2>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
            Enroll in a course on the dashboard and Atlas will open its foundation layer for you.
          </p>
          <a href="/" className="btn-primary mt-6">
            Go to dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 lg:grid-cols-[290px_1fr]">
      {/* Course + ladder rail */}
      <aside className="hidden min-h-0 flex-col border-r border-ink-200/80 bg-white/60 p-4 lg:flex dark:border-ink-800 dark:bg-ink-950/40">
        <label className="section-title mb-2 block">Course</label>
        <select
          value={activeCourse.slug}
          onChange={(event) => switchCourse(event.target.value)}
          className="input mb-5 text-sm"
        >
          {courses.map((course) => (
            <option key={course.slug} value={course.slug}>
              {course.title}
            </option>
          ))}
        </select>

        <div className="mb-2 flex items-center justify-between">
          <span className="section-title">Layer ladder</span>
          <span className="text-[11px] font-semibold text-ink-400">
            {activeCourse.passedLayers ?? activeCourse.modules.filter((m) => m.status === 'PASSED').length}/
            {activeCourse.layerCount}
          </span>
        </div>
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {activeCourse.modules.map((module) => {
            const locked = module.status === 'LOCKED';
            const passed = module.status === 'PASSED';
            return (
              <button
                key={module.id}
                type="button"
                onClick={() => (locked ? undefined : teach(activeCourse.slug, module.layer))}
                disabled={locked || pending}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                  passed
                    ? 'border-atlas-200 bg-atlas-50/70 hover:bg-atlas-100/70 dark:border-atlas-800/60 dark:bg-atlas-900/20 dark:hover:bg-atlas-900/30'
                    : locked
                      ? 'cursor-not-allowed border-ink-200/60 bg-ink-50/50 opacity-70 dark:border-ink-800 dark:bg-ink-900/30'
                      : 'border-ink-200 bg-white hover:border-atlas-400 dark:border-ink-700 dark:bg-ink-900 dark:hover:border-atlas-600'
                }`}
              >
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                  {passed ? (
                    <Check className="h-3 w-3 text-atlas-600 dark:text-atlas-400" />
                  ) : locked ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-atlas-600 dark:text-atlas-400" />
                  )}
                  Layer {module.layer} · {module.tier.toLowerCase()}
                </span>
                <span
                  className={`mt-1 block text-[13px] font-medium leading-snug ${
                    locked ? 'text-ink-400 dark:text-ink-500' : 'text-ink-800 dark:text-ink-100'
                  }`}
                >
                  {module.title}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-2 border-t border-ink-200 pt-4 dark:border-ink-800">
          <button type="button" onClick={() => setSandboxOpen(true)} className="btn-secondary w-full justify-start text-sm">
            <Terminal className="h-4 w-4" /> Code sandbox
          </button>
          <div className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2 text-[11px] font-medium text-ink-500 dark:bg-ink-900 dark:text-ink-400">
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-atlas-600 dark:text-atlas-400" /> Balance
            </span>
            <span className="font-bold tabular-nums text-ink-800 dark:text-ink-100">{credits ?? '—'} credits</span>
          </div>
        </div>
      </aside>

      {/* Conversation */}
      <section className="flex min-h-0 flex-col">
        <header className="flex items-center gap-3 border-b border-ink-200/80 bg-white/70 px-4 py-3 backdrop-blur sm:px-6 dark:border-ink-800 dark:bg-ink-950/50">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-atlas-400 to-atlas-700 text-sm font-black text-white">
            A
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
              Atlas · {activeCourse.title}
            </p>
            <p className="truncate text-[11px] text-ink-500 dark:text-ink-400">
              Layer-by-layer Socratic tutor · {activeCourse.discipline}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {nextLayer ? (
              <button
                type="button"
                onClick={() => teach(activeCourse.slug, nextLayer.layer)}
                disabled={pending || nextLayer.status === 'LOCKED'}
                className="hidden items-center gap-1.5 rounded-lg border border-atlas-300/60 bg-atlas-50 px-2.5 py-1.5 text-[11px] font-semibold text-atlas-700 transition hover:bg-atlas-100 sm:inline-flex dark:border-atlas-800 dark:bg-atlas-900/30 dark:text-atlas-300"
              >
                <Layers className="h-3.5 w-3.5" />
                {nextLayer.status === 'PASSED' ? `Revisit layer ${nextLayer.layer}` : `Continue layer ${nextLayer.layer}`}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setSandboxOpen(true)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-100 lg:hidden dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
              aria-label="Open sandbox"
            >
              <Terminal className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-5">
            {messages.map((message) =>
              message.role === 'user' ? (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-atlas-600 px-4 py-2.5 text-sm text-white shadow-sm">
                    {message.markdown}
                  </div>
                </div>
              ) : (
                <div key={message.id} className="flex gap-3">
                  <span
                    className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-black text-white ${
                      message.role === 'error'
                        ? 'bg-rose-500'
                        : 'bg-gradient-to-br from-atlas-400 to-atlas-700'
                    }`}
                  >
                    {message.role === 'error' ? <AlertTriangle className="h-4 w-4" /> : 'A'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className={
                        message.role === 'error'
                          ? 'rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200'
                          : ''
                      }
                    >
                      <CodeMathBlock markdown={message.markdown} />
                    </div>
                    {message.checkpoint ? <CheckpointCard checkpoint={message.checkpoint} /> : null}
                    {message.meta?.engine === 'local' ? (
                      <p className="mt-2 text-[10px] uppercase tracking-wider text-ink-400 dark:text-ink-600">
                        Curriculum engine · {message.meta.courseTitle} · layer {message.meta.layer}
                      </p>
                    ) : null}
                  </div>
                </div>
              ),
            )}

            {pending ? (
              <div className="flex gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-atlas-400 to-atlas-700 text-xs font-black text-white">
                  A
                </span>
                <div className="flex items-center gap-1.5 rounded-2xl border border-ink-200 bg-white px-4 py-3 dark:border-ink-800 dark:bg-ink-900">
                  {[0, 1, 2].map((index) => (
                    <span
                      key={index}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-atlas-500"
                      style={{ animationDelay: `${index * 120}ms` }}
                    />
                  ))}
                  <span className="ml-1 text-[11px] font-medium text-ink-400">assembling the lesson</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-ink-200/80 bg-white/80 px-4 py-3 backdrop-blur sm:px-6 dark:border-ink-800 dark:bg-ink-950/60">
          <div className="mx-auto max-w-3xl">
            {visibleFollowUps.length ? (
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {visibleFollowUps.slice(0, 3).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    disabled={pending}
                    className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white px-2.5 py-1 text-[11px] font-medium text-ink-600 transition hover:border-atlas-400 hover:text-atlas-700 disabled:opacity-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:border-atlas-600 dark:hover:text-atlas-300"
                  >
                    <Sparkles className="h-3 w-3" />
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex items-end gap-2 rounded-2xl border border-ink-200 bg-white p-2 shadow-sm focus-within:border-atlas-400 focus-within:ring-2 focus-within:ring-atlas-500/20 dark:border-ink-700 dark:bg-ink-900">
              <textarea
                ref={composerRef}
                value={input}
                rows={1}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void send(input);
                  }
                }}
                placeholder="Ask Atlas anything about this course — answer the checkpoint first if you can."
                aria-label="Message Atlas"
                className="max-h-40 min-h-[38px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-400 dark:text-ink-100 dark:placeholder:text-ink-500"
              />
              <button
                type="button"
                onClick={() => setSandboxOpen(true)}
                aria-label="Open code sandbox"
                className="hidden h-9 w-9 shrink-0 place-items-center rounded-xl text-ink-400 hover:bg-ink-100 hover:text-ink-700 sm:grid dark:hover:bg-ink-800 dark:hover:text-ink-200"
              >
                <Terminal className="h-[18px] w-[18px]" />
              </button>
              <button
                type="button"
                onClick={() => send(input)}
                disabled={pending || !input.trim()}
                aria-label="Send message"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-atlas-600 text-white transition hover:bg-atlas-500 disabled:opacity-40"
              >
                {pending ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 flex items-center gap-1 text-[10px] text-ink-400 dark:text-ink-500">
              <Brain className="h-3 w-3" /> 1 credit per question · 2 per layer lesson · answers are grounded in the
              curriculum, not improvised.
              <ArrowRight className="ml-auto hidden h-3 w-3 sm:block" />
            </p>
          </div>
        </div>
      </section>

      <CodeSandbox open={sandboxOpen} onClose={() => setSandboxOpen(false)} />
    </div>
  );
}
