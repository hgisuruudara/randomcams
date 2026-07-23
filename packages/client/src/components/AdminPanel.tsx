import { useEffect, useState } from 'react';
import { ModerationReportView, listPendingReports, resolveReport } from '../api/rest';
import { Logo } from './Logo';

const ADMIN_TOKEN_STORAGE_KEY = 'randomcams_admin_token';

const REASON_LABELS: Record<string, string> = {
  NUDITY_OR_SEXUAL_CONTENT_WITHOUT_CONSENT: 'Non-consensual nudity / sexual content',
  SUSPECTED_MINOR: 'Suspected minor',
  HARASSMENT: 'Harassment or abuse',
  SCAM_OR_SOLICITATION: 'Scam or solicitation',
  OTHER: 'Other',
};

const REASON_COLORS: Record<string, string> = {
  SUSPECTED_MINOR: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  NUDITY_OR_SEXUAL_CONTENT_WITHOUT_CONSENT: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
};

export function AdminPanel() {
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) ?? '');
  const [reports, setReports] = useState<ModerationReportView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewerLabel, setReviewerLabel] = useState('');

  async function refresh(token: string) {
    setError(null);
    try {
      setReports(await listPendingReports(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to load reports');
      setReports(null);
    }
  }

  useEffect(() => {
    if (adminToken) refresh(adminToken);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, adminToken);
    refresh(adminToken);
  }

  async function handleResolve(reportId: string, action: 'ACTION_TAKEN' | 'DISMISSED') {
    try {
      await resolveReport(adminToken, reportId, action, reviewerLabel || undefined);
      await refresh(adminToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to resolve report');
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Logo size={36} />
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Moderation queue</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Reports here have <strong>not</strong> resulted in any account action yet.
          </p>
        </div>
      </div>

      <form onSubmit={handleTokenSubmit} className="card mb-6 flex flex-wrap gap-3 p-5">
        <input
          type="password"
          placeholder="Admin token"
          value={adminToken}
          onChange={(e) => setAdminToken(e.target.value)}
          className="input flex-1"
          style={{ minWidth: 180 }}
        />
        <input
          placeholder="Your name (for the audit trail)"
          value={reviewerLabel}
          onChange={(e) => setReviewerLabel(e.target.value)}
          className="input flex-1"
          style={{ minWidth: 180 }}
        />
        <button type="submit" className="btn-primary">
          Load reports
        </button>
      </form>

      {error && (
        <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      )}

      {reports && reports.length === 0 && (
        <div className="card p-10 text-center text-sm text-slate-400 dark:text-slate-500">
          No pending reports. 🎉
        </div>
      )}

      <div className="space-y-4">
        {reports?.map((report) => (
          <div key={report.id} className="card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${REASON_COLORS[report.reason] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                {REASON_LABELS[report.reason] ?? report.reason}
              </span>
              {report.note && <span className="text-sm italic text-slate-500 dark:text-slate-400">"{report.note}"</span>}
            </div>

            <div className="mt-3 grid gap-1 text-sm text-slate-600 dark:text-slate-300">
              <p>
                <span className="font-semibold text-slate-800 dark:text-slate-100">Reported:</span>{' '}
                {report.reportedUser.displayName} ({report.reportedUser.email},{' '}
                {report.reportedUser.verifiedGender ?? 'unverified'})
              </p>
              <p>
                <span className="font-semibold text-slate-800 dark:text-slate-100">Reporter:</span>{' '}
                {report.reporter.displayName} ({report.reporter.email})
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Session {report.sessionId} · Filed {new Date(report.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={() => handleResolve(report.id, 'ACTION_TAKEN')} className="btn-danger !px-4 !py-2 text-xs">
                Take action (ban)
              </button>
              <button onClick={() => handleResolve(report.id, 'DISMISSED')} className="btn-secondary !px-4 !py-2 text-xs">
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
