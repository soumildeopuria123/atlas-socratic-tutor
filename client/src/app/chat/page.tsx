'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiError, get } from '@/lib/api';
import type { DashboardData } from '@/lib/types';
import ChatInterface from '@/components/ChatInterface';
import { AlertTriangle, Loader } from '@/components/icons';

export default function ChatPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    get<DashboardData>('/progress')
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((caught) => {
        if (cancelled) return;
        if (caught instanceof ApiError && caught.status === 401) {
          router.replace('/login?next=/chat');
          return;
        }
        setError(caught instanceof ApiError ? caught.message : 'Could not load your courses.');
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
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
      <div className="grid h-[calc(100vh-4rem)] place-items-center">
        <div className="flex items-center gap-2 text-sm font-medium text-ink-400">
          <Loader className="h-4 w-4 animate-spin" /> Opening your workspace…
        </div>
      </div>
    );
  }

  return <ChatInterface courses={data.courses} />;
}
