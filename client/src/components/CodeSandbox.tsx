'use client';

import { useEffect, useState } from 'react';
import { ApiError, post } from '@/lib/api';
import { useCredits } from './CreditsProvider';
import { Loader, Play, Terminal, X, Zap } from './icons';

type Language = 'javascript' | 'python' | 'c' | 'cpp' | 'java';

const TEMPLATES: Record<Language, string> = {
  javascript: `// JavaScript — runs on the Atlas sandbox host
const layers = [1, 2, 3, 4, 5];
const passed = layers.filter((layer) => layer <= 3);
console.log("passed layers:", passed);
console.log("next unlock:", Math.max(...passed) + 1);
`,
  python: `# Python — isolated mode, no site packages
concepts = {
    "sine": "opposite / hypotenuse",
    "cosine": "adjacent / hypotenuse",
    "tangent": "opposite / adjacent",
}

for term, definition in concepts.items():
    print(f"{term:8s} = {definition}")
`,
  c: `#include <stdio.h>
#include <math.h>

int main(void) {
    double degrees = 30.0;
    double radians = degrees * M_PI / 180.0;
    printf("sin(30) = %.4f\\n", sin(radians));
    return 0;
}
`,
  cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> layers{1, 2, 3, 4, 5};
    int passed = 0;
    for (int layer : layers) {
        if (layer <= 3) passed++;
    }
    cout << "passed layers: " << passed << endl;
    return 0;
}
`,
  java: `public class Main {
    public static void main(String[] args) {
        int[] layers = {1, 2, 3, 4, 5};
        int passed = 0;
        for (int layer : layers) {
            if (layer <= 3) passed++;
        }
        System.out.println("passed layers: " + passed);
    }
}
`,
};

const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'java', label: 'Java' },
];

interface RunResult {
  supported: boolean;
  message?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  timedOut?: boolean;
  durationMs?: number;
  phase?: string;
  credits?: number;
  cost?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  initialCode?: string;
  initialLanguage?: Language;
}

export default function CodeSandbox({ open, onClose, initialCode, initialLanguage = 'javascript' }: Props) {
  const { setCredits } = useCredits();
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [code, setCode] = useState(initialCode ?? TEMPLATES[initialLanguage]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (initialCode) setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function changeLanguage(next: Language) {
    setLanguage(next);
    setResult(null);
    setError(null);
    setCode(TEMPLATES[next]);
  }

  async function run() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const data = await post<RunResult>('/sandbox/run', { language, code });
      setResult(data);
      if (typeof data.credits === 'number') setCredits(data.credits);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        if (caught.code === 'INSUFFICIENT_CREDITS') setCredits(0);
      } else {
        setError('Could not reach the sandbox.');
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Code sandbox"
        className="flex h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-ink-200 bg-white shadow-2xl sm:h-[80vh] sm:rounded-3xl dark:border-ink-800 dark:bg-ink-950"
      >
        <div className="flex items-center gap-3 border-b border-ink-200 px-5 py-3.5 dark:border-ink-800">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink-900 text-white dark:bg-ink-800">
            <Terminal className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900 dark:text-white">Code sandbox</p>
            <p className="text-[11px] text-ink-500 dark:text-ink-400">
              2 credits per run · 8 second limit · no network
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sandbox"
            className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-b border-ink-200 px-5 py-2.5 dark:border-ink-800">
          {LANGUAGES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => changeLanguage(item.id)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                language === item.id
                  ? 'bg-ink-900 text-white dark:bg-atlas-600'
                  : 'text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => changeLanguage(language)}
            className="ml-auto rounded-lg px-2 py-1 text-[11px] font-medium text-ink-400 hover:text-ink-700 dark:hover:text-ink-200"
          >
            reset template
          </button>
        </div>

        <div className="grid flex-1 grid-rows-[1fr_auto] overflow-hidden lg:grid-cols-2 lg:grid-rows-1">
          <div className="flex min-h-0 flex-col border-b border-ink-200 lg:border-b-0 lg:border-r dark:border-ink-800">
            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              spellCheck={false}
              aria-label={`${language} source code`}
              className="h-full min-h-[180px] w-full resize-none bg-ink-950 p-4 font-mono text-[13px] leading-relaxed text-ink-100 outline-none placeholder:text-ink-600"
            />
          </div>

          <div className="flex min-h-0 flex-col bg-ink-50 dark:bg-ink-900/40">
            <div className="flex items-center justify-between border-b border-ink-200 px-4 py-2 dark:border-ink-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
                Output
              </span>
              {result?.durationMs ? (
                <span className="text-[11px] text-ink-400">{result.durationMs} ms</span>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4 font-mono text-[12.5px] leading-relaxed">
              {error ? (
                <p className="whitespace-pre-wrap text-rose-600 dark:text-rose-300">{error}</p>
              ) : !result ? (
                <p className="text-ink-400 dark:text-ink-500">
                  Press Run to execute. Compiled languages are built first; missing toolchains are
                  reported without charging credits.
                </p>
              ) : !result.supported ? (
                <p className="whitespace-pre-wrap text-amber-700 dark:text-amber-300">{result.message}</p>
              ) : (
                <div className="space-y-2">
                  {result.stdout ? (
                    <pre className="whitespace-pre-wrap text-ink-800 dark:text-ink-100">{result.stdout}</pre>
                  ) : null}
                  {result.stderr ? (
                    <pre className="whitespace-pre-wrap text-rose-600 dark:text-rose-300">{result.stderr}</pre>
                  ) : null}
                  <p
                    className={`text-[11px] font-semibold ${
                      result.exitCode === 0
                        ? 'text-atlas-700 dark:text-atlas-400'
                        : 'text-rose-600 dark:text-rose-300'
                    }`}
                  >
                    exit {result.exitCode}
                    {result.timedOut ? ' · timed out' : ''}
                    {result.phase === 'compile' ? ' · compilation failed' : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-ink-200 px-5 py-3 dark:border-ink-800">
          <p className="hidden items-center gap-1.5 text-[11px] text-ink-400 sm:flex dark:text-ink-500">
            <Zap className="h-3 w-3" /> A failed toolchain check is refunded automatically.
          </p>
          <button type="button" onClick={run} disabled={running} className="btn-primary ml-auto">
            {running ? <Loader className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? 'Running…' : 'Run code'}
            <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-bold">2 cr</span>
          </button>
        </div>
      </div>
    </div>
  );
}
