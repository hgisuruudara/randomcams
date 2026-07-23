import type { ReactNode } from 'react';
import { Logo } from '../components/Logo';

export function LegalPage({ title, version, children }: { title: string; version: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-6 flex items-center gap-3">
        <Logo size={32} />
        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">randomcams</span>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
        <span className="mt-0.5 text-lg leading-none">⚠️</span>
        <p>
          <strong>Draft — not final.</strong> This document has not been reviewed by a lawyer and
          should not be relied on or published as-is. It exists to show the shape of what's needed
          and to give counsel a concrete starting point.
        </p>
      </div>

      <div className="card p-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Version {version}</p>
        <div className="prose-legal mt-6">{children}</div>
      </div>
    </div>
  );
}
