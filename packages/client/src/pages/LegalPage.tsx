import type { ReactNode } from 'react';

export function LegalPage({ title, version, children }: { title: string; version: string; children: ReactNode }) {
  return (
    <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'sans-serif', lineHeight: 1.5 }}>
      <div
        style={{
          background: '#fff3cd',
          border: '1px solid #ffe69c',
          borderRadius: 8,
          padding: 12,
          marginBottom: 24,
          fontSize: 14,
        }}
      >
        <strong>Draft — not final.</strong> This document has not been reviewed by a lawyer and
        should not be relied on or published as-is. It exists to show the shape of what's needed
        and to give counsel a concrete starting point.
      </div>
      <h1>{title}</h1>
      <p style={{ fontSize: 13, color: '#666' }}>Version {version}</p>
      {children}
    </div>
  );
}
