import AuthForm from '@/components/AuthForm';
import Link from 'next/link';
import { Brain, Timer, Trophy, Zap } from '@/components/icons';

export const metadata = { title: 'Create account' };

const POINTS = [
  { icon: Zap, text: '60 credits provisioned on sign-up' },
  { icon: Trophy, text: 'Mastery rewards refund and extend your credits' },
  { icon: Timer, text: 'Timed assessments scaled by layer difficulty' },
  { icon: Brain, text: 'Every pass seeds your review deck automatically' },
];

export default function SignupPage() {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 px-4 py-12 lg:grid-cols-2 lg:px-8">
      <div className="hidden lg:block">
        <Link href="/signup" className="mb-8 inline-flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-atlas-400 to-atlas-700 text-base font-black text-white">
            A
          </span>
          <span className="text-lg font-bold tracking-tight text-ink-900 dark:text-white">Atlas</span>
        </Link>
        <h2 className="max-w-md text-4xl font-bold leading-tight tracking-tight text-ink-900 dark:text-white">
          Start at layer one. Finish with mastery.
        </h2>
        <p className="mt-4 max-w-md text-ink-500 dark:text-ink-400">
          No placement test, no skipping. Atlas builds the foundation first, then earns you the
          advanced layers with assessments that gate every step.
        </p>
        <ul className="mt-9 space-y-3.5">
          {POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-ink-600 dark:text-ink-300">
              <Icon className="h-4 w-4 shrink-0 text-atlas-600 dark:text-atlas-400" />
              {text}
            </li>
          ))}
        </ul>
        <div className="mt-10 max-w-md rounded-2xl border border-ink-200 bg-white/70 p-5 text-sm leading-relaxed text-ink-600 dark:border-ink-800 dark:bg-ink-900/50 dark:text-ink-300">
          <span className="font-semibold text-ink-900 dark:text-white">What Atlas will ask of you:</span>{' '}
          answer the checkpoint question before moving on. The Socratic method only works if you
          commit to a guess first.
        </div>
      </div>
      <div className="flex justify-center lg:justify-end">
        <AuthForm mode="signup" />
      </div>
    </div>
  );
}
