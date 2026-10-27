'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Check, Code } from './icons';

/** Mermaid is heavy; render lazily and only in the browser. */
function MermaidDiagram({ code }: { code: string }) {
  const reactId = useId();
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [themeTick, setThemeTick] = useState(0);
  const idRef = useRef(`mermaid-${reactId.replace(/[^a-zA-Z0-9]/g, '')}`);

  // Re-render diagrams when the learner flips the theme, otherwise a dark SVG
  // would stay embedded in a light page (and vice versa).
  useEffect(() => {
    const observer = new MutationObserver(() => setThemeTick((value) => value + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        const dark = document.documentElement.classList.contains('dark');
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: dark ? 'dark' : 'base',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          themeVariables: dark
            ? { primaryColor: '#0f2a24', primaryTextColor: '#e2e8f0', lineColor: '#34d399', background: '#0f172a' }
            : { primaryColor: '#ecfdf5', primaryTextColor: '#0f172a', lineColor: '#059669', background: '#ffffff' },
        });
        const { svg: rendered } = await mermaid.render(
          `${idRef.current}-${Math.random().toString(36).slice(2, 8)}`,
          code,
        );
        if (!cancelled) setSvg(rendered);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    void render();
    return () => {
      cancelled = true;
    };
  }, [code, themeTick]);

  if (failed) {
    return (
      <pre className="overflow-x-auto rounded-xl border border-ink-200 bg-ink-950 p-4 text-xs text-ink-100 dark:border-ink-800">
        <code>{code}</code>
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-ink-300 bg-ink-50/60 text-xs font-medium text-ink-400 dark:border-ink-700 dark:bg-ink-900/40 dark:text-ink-500">
        drawing structure…
      </div>
    );
  }

  return (
    <div
      className="mermaid-frame overflow-x-auto rounded-xl border border-ink-200 bg-white p-3 dark:border-ink-800 dark:bg-ink-950/60"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard permission denied */
        }
      }}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-ink-400 transition hover:bg-white/10 hover:text-ink-100"
      aria-label="Copy code"
    >
      {copied ? <Check className="h-3 w-3" /> : <Code className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-800 bg-ink-950">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-400">
          {language || 'code'}
        </span>
        <CopyButton text={code} />
      </div>
      <pre className="max-h-[26rem] overflow-auto p-4 text-[13px] leading-relaxed text-ink-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const components: Components = {
  // react-markdown v9 wraps fenced code in <pre>; our block supplies its own.
  pre: ({ children }) => <>{children}</>,
  code({ className, children, ...props }) {
    const text = String(children ?? '').replace(/\n$/, '');
    const match = /language-(\w+)/.exec(className ?? '');
    const language = match?.[1] ?? '';

    if (language === 'mermaid') return <MermaidDiagram code={text} />;
    if (language) return <CodeBlock language={language} code={text} />;

    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  table: ({ children }) => (
    <div className="overflow-x-auto rounded-xl border border-ink-200 dark:border-ink-800">
      <table className="my-0">{children}</table>
    </div>
  ),
};

export default function CodeMathBlock({ markdown }: { markdown: string }) {
  const plugins = useMemo(
    () => ({ remark: [remarkGfm, remarkMath], rehype: [rehypeKatex] }),
    [],
  );

  return (
    <div className="atlas-prose">
      <ReactMarkdown
        remarkPlugins={plugins.remark}
        rehypePlugins={plugins.rehype}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
