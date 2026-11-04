'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiError, post } from '@/lib/api';
import { useCredits } from './CreditsProvider';
import { AlertTriangle, Eye, EyeOff, Loader, Zap } from './icons';

type Mode = 'login' | 'signup';

interface Props {
  mode: Mode;
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const { setCredits, refresh } = useCredits();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  const isSignup = mode === 'signup';

  function validate() {
    const errors: Record<string, string> = {};
    if (!USERNAME_RE.test(username.trim())) {
      errors.username = '3–24 characters: letters, numbers, or underscores.';
    }
    if (isSignup && password.length < 8) {
      errors.password = 'At least 8 characters.';
    } else if (isSignup && (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))) {
      errors.password = 'Include at least one letter and one number.';
    }
    if (!password) errors.password = errors.password ?? 'Enter your password.';
    if (isSignup && confirm !== password) errors.confirm = 'Passwords do not match.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!validate()) return;

    setPending(true);
    try {
      const data = await post<{ user: { credits: number } }>(
        isSignup ? '/auth/signup' : '/auth/login',
        { username: username.trim(), password },
      );
      setCredits(data.user.credits);
      // Populate the header identity and credits without requiring a reload.
      await refresh();
      const next = new URLSearchParams(window.location.search).get('next');
      const destination = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
      router.push(destination);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Could not reach the server. Check that the API is running.',
      );
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="panel p-7 sm:p-8">
        <div className="mb-7">
          <span className="chip-green mb-4 inline-flex">
            <Zap className="h-3 w-3" />
            {isSignup ? `${60} starter credits` : 'Secure session'}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
            {isSignup ? 'Create your Atlas account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
            {isSignup
              ? 'One username, one password. Atlas provisions your credits and unlocks the foundation layer of every course.'
              : 'Sign in to continue your ladder. Your progress, credits, and review deck are waiting.'}
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="username" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
              Username
            </label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              className="input"
              placeholder="ada_lovelace"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              aria-invalid={Boolean(fieldErrors.username)}
              required
            />
            {fieldErrors.username ? (
              <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{fieldErrors.username}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                className="input pr-11"
                placeholder={isSignup ? 'At least 8 characters' : '••••••••'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password ? (
              <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{fieldErrors.password}</p>
            ) : null}
          </div>

          {isSignup ? (
            <div>
              <label htmlFor="confirm" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                Confirm password
              </label>
              <input
                id="confirm"
                name="confirm"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="input"
                placeholder="Repeat password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                aria-invalid={Boolean(fieldErrors.confirm)}
                required
              />
              {fieldErrors.confirm ? (
                <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{fieldErrors.confirm}</p>
              ) : null}
            </div>
          ) : null}

          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {pending ? <Loader className="h-4 w-4 animate-spin" /> : null}
            {pending
              ? isSignup
                ? 'Provisioning account…'
                : 'Signing in…'
              : isSignup
                ? 'Create account'
                : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
          {isSignup ? 'Already have an account?' : 'New to Atlas?'}{' '}
          <Link
            href={isSignup ? '/login' : '/signup'}
            className="font-semibold text-atlas-700 hover:underline dark:text-atlas-300"
          >
            {isSignup ? 'Sign in' : 'Create one'}
          </Link>
        </p>
      </div>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-400 dark:text-ink-500">
        Passwords are hashed with bcrypt and never stored in plain text. Sessions live in an
        httpOnly cookie that page scripts cannot read.
      </p>
    </div>
  );
}
