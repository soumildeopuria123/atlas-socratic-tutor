import AuthForm from '@/components/AuthForm';
import Link from 'next/link';
import { Layers, ShieldCheck, Sparkles } from '@/components/icons';

export const metadata = { title: 'Sign in' };

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Layer-by-layer teaching',
    body: 'Atlas starts at the absolute foundation — right-triangle ratios, limits, array indexing — and never jumps ahead.',
  },
  {
    icon: ShieldCheck,
    title: 'Mastery gates that mean something',
    body: '75% or higher to advance, timed full-screen sittings, and a fresh variant on every retest.',
  },
  {
    icon: Layers,
    title: 'Knowledge that stays',
    body: 'Every layer you pass seeds a spaced-repetition deck scheduled with SM-2.',
  },
];

export default function LoginPage() {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 px-4 py-12 lg:grid-cols-2 lg:px-8">
      <div className="hidden lg:block">
        <Link href="/login" className="mb-8 inline-flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-atlas-400 to-atlas-700 text-base font-black text-white">
            A
          </span>
          <span className="text-lg font-bold tracking-tight text-ink-900 dark:text-white">Atlas</span>
        </Link>
        <h2 className="max-w-md text-4xl font-bold leading-tight tracking-tight text-ink-900 dark:text-white">
          The tutor that refuses to skip the foundations.
        </h2>
        <p className="mt-4 max-w-md text-ink-500 dark:text-ink-400">
          Trigonometry, calculus, data structures, operating systems, machine learning, tech ethics —
          every subject taught the same rigorous way, one layer at a time.
        </p>
        <ul className="mt-9 space-y-5">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3.5">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-atlas-200 bg-atlas-50 text-atlas-700 dark:border-atlas-800/60 dark:bg-atlas-900/30 dark:text-atlas-300">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900 dark:text-white">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex justify-center lg:justify-end">
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
