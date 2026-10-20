'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { useCredits } from './CreditsProvider';
import { post } from '@/lib/api';
import { GraduationCap, Layers, LogOut, Menu, Sparkles, X, Zap } from './icons';

const LINKS = [
  { href: '/', label: 'Dashboard', icon: GraduationCap },
  { href: '/chat', label: 'Atlas', icon: Sparkles },
  { href: '/srs', label: 'Review', icon: Layers },
];

const HIDDEN_ON = ['/login', '/signup', '/assessment'];

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { credits, username } = useCredits();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (HIDDEN_ON.some((path) => pathname?.startsWith(path))) return null;

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname?.startsWith(href));

  async function signOut() {
    setSigningOut(true);
    try {
      await post('/auth/logout');
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/80 backdrop-blur-xl dark:border-ink-800/80 dark:bg-ink-950/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-atlas-400 to-atlas-700 text-sm font-black text-white shadow-sm">
            A
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amberglow ring-2 ring-white dark:ring-ink-950" />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight text-ink-900 dark:text-white">
              Atlas
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-ink-500 sm:block dark:text-ink-400">
              Socratic Tutor
            </span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive(href)
                  ? 'bg-atlas-50 text-atlas-700 dark:bg-atlas-900/30 dark:text-atlas-300'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800/70 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/srs"
            title="Available credits"
            className="inline-flex items-center gap-1.5 rounded-full border border-atlas-300/60 bg-atlas-50 px-3 py-1.5 text-xs font-bold text-atlas-700 transition hover:bg-atlas-100 dark:border-atlas-700/50 dark:bg-atlas-900/30 dark:text-atlas-300 dark:hover:bg-atlas-900/50"
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="tabular-nums">{credits ?? '—'}</span>
            <span className="hidden font-medium text-atlas-600/80 sm:inline dark:text-atlas-400/80">
              credits
            </span>
          </Link>

          <ThemeToggle />

          {username ? (
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="max-w-[9rem] truncate rounded-lg px-2 py-1 text-xs font-semibold text-ink-600 dark:text-ink-300">
                {username}
              </span>
              <button
                type="button"
                onClick={signOut}
                disabled={signingOut}
                title="Sign out"
                aria-label="Sign out"
                className="grid h-9 w-9 place-items-center rounded-xl text-ink-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:text-ink-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle navigation"
            className="grid h-9 w-9 place-items-center rounded-xl border border-ink-200 text-ink-600 md:hidden dark:border-ink-700 dark:text-ink-300"
          >
            {open ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-ink-200/70 bg-white px-3 py-2 md:hidden dark:border-ink-800 dark:bg-ink-950">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium ${
                isActive(href)
                  ? 'bg-atlas-50 text-atlas-700 dark:bg-atlas-900/30 dark:text-atlas-300'
                  : 'text-ink-600 dark:text-ink-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          {username ? (
            <button
              type="button"
              onClick={signOut}
              className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-300"
            >
              <LogOut className="h-4 w-4" /> Sign out @{username}
            </button>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
