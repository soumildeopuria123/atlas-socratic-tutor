'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiError, get } from '@/lib/api';
import type { Attempt } from '@/lib/types';
import AssessmentView from '@/components/AssessmentView';
import { AlertTriangle, Loader } from '@/components/icons';

export default function AssessmentPage() {
  const router = useRouter();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('attempt');
    if (!id) {
      setError('No assessment was specified. Start one from your dashboard.');
      return;
    }
    let cancelled = false;
    get<{ attempt: Attempt }>(`/assessment/${id}`)
      .then((payload) => {
        if (!cancelled) setAttempt(payload.attempt);
      })
      .catch((caught) => {
        if (cancelled) return;
        setError(caught instanceof ApiError ? caught.message : 'Could not load the attempt.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="panel w-full max-w-md p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
          <h1 className="mt-3 text-lg font-semibold text-ink-900 dark:text-white">Cannot open this attempt</h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{error}</p>
          <Link href="/" className="btn-primary mt-5">
            Return to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex items-center gap-2 text-sm font-medium text-ink-400">
          <Loader className="h-4 w-4 animate-spin" /> Loading secure assessment…
        </div>
      </div>
    );
  }

  return <AssessmentView initialAttempt={attempt} onExit={() => router.push('/')} />;
}
