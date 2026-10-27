'use client';

import { useState } from 'react';
import { ApiError, post } from '@/lib/api';
import { useCredits } from './CreditsProvider';
import { Check, Coin, Flame, Loader, Sparkles, Zap } from './icons';

const SPEND = [
  { label: 'Ask Atlas', cost: 1 },
  { label: 'Layer lesson', cost: 2 },
  { label: 'Run code', cost: 2 },
  { label: 'Assessment', cost: 3 },
  { label: 'Retest variant', cost: 4 },
];

interface Props {
  credits: number;
  dueCards: number;
  onCredits?: (credits: number) => void;
}

export default function CreditTracker({ credits, dueCards, onCredits }: Props) {
  const { setCredits } = useCredits();
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'warn'; text: string } | null>(null);

  const low = credits < 3;

  async function claim() {
    setClaiming(true);
    setMessage(null);
    try {
      const data = await post<{ user: { credits: number }; granted: number }>('/auth/allowance');
      setCredits(data.user.credits);
      onCredits?.(data.user.credits);
      setMessage({ tone: 'ok', text: `+${data.granted} credits added.` });
    } catch (caught) {
      setMessage({
        tone: 'warn',
        text: caught instanceof ApiError ? caught.message : 'Could not claim the allowance.',
      });
    } finally {
      setClaiming(false);
    }
  }

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-ink-200/80 bg-gradient-to-br from-atlas-50 to-white px-5 py-4 dark:border-ink-800 dark:from-atlas-900/25 dark:to-ink-900/40">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-800 dark:text-ink-100">
            <Zap className="h-4 w-4 text-atlas-600 dark:text-atlas-400" />
            Platform credits
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">live</span>
        </div>
        <div className="mt-3 flex items-end gap-2">
          <span className="text-4xl font-black tabular-nums tracking-tight text-ink-900 dark:text-white">
            {credits}
          </span>
          <span className="pb-1.5 text-xs font-medium text-ink-500 dark:text-ink-400">available</span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-200/80 dark:bg-ink-800">
          <div
            className={`h-full rounded-full transition-all ${
              low ? 'bg-gradient-to-r from-amber-400 to-rose-500' : 'bg-gradient-to-r from-atlas-400 to-atlas-600'
            }`}
            style={{ width: `${Math.min(100, Math.max(4, (credits / 100) * 100))}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-ink-500 dark:text-ink-400">
          {low
            ? 'Low balance — review flashcards or claim the daily allowance to keep going.'
            : 'Credits meter every AI generation and code execution.'}
        </p>
      </div>

      <div className="p-5">
        <p className="section-title mb-2.5">What things cost</p>
        <ul className="space-y-1.5">
          {SPEND.map((item) => (
            <li key={item.label} className="flex items-center justify-between text-[13px]">
              <span className="text-ink-600 dark:text-ink-300">{item.label}</span>
              <span
                className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold ${
                  credits >= item.cost
                    ? 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300'
                    : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300'
                }`}
              >
                {item.cost} cr
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-2 rounded-xl border border-ink-200/80 bg-ink-50/60 p-3 dark:border-ink-800 dark:bg-ink-950/40">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
            Earn credits
          </p>
          <p className="flex items-center gap-2 text-[12px] text-ink-600 dark:text-ink-300">
            <Coin className="h-3.5 w-3.5 text-atlas-600 dark:text-atlas-400" /> Pass a layer: <strong>+8</strong>
          </p>
          <p className="flex items-center gap-2 text-[12px] text-ink-600 dark:text-ink-300">
            <Flame className="h-3.5 w-3.5 text-amber-500" /> Review a card: <strong>+1</strong>
            <span className="text-[10px] text-ink-400">({dueCards} due)</span>
          </p>
          <button
            type="button"
            onClick={claim}
            disabled={claiming}
            className="btn-secondary mt-1 w-full py-2 text-xs"
          >
            {claiming ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Claim daily +5
          </button>
          {message ? (
            <p
              className={`flex items-center gap-1 text-[11px] ${
                message.tone === 'ok' ? 'text-atlas-700 dark:text-atlas-300' : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {message.tone === 'ok' ? <Check className="h-3 w-3" /> : null}
              {message.text}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
