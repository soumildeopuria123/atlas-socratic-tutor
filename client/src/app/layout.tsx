import type { Metadata, Viewport } from 'next';
import './globals.css';
import 'katex/dist/katex.min.css';
import { ThemeProvider, themeScript } from '@/components/ThemeProvider';
import { CreditsProvider } from '@/components/CreditsProvider';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: {
    default: 'Atlas — Adaptive Socratic Tutor',
    template: '%s · Atlas',
  },
  description:
    'Atlas teaches any subject layer by layer, from the absolute foundation to advanced application, with timed mastery assessments and spaced repetition.',
  applicationName: 'Atlas',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#080d16' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider>
          <CreditsProvider>
            <SiteHeader />
            <div className="min-h-[calc(100vh-4rem)]">{children}</div>
          </CreditsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
