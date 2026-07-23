import { useEffect, useState } from 'react';
import { ModerationReportView, listPendingReports, resolveReport } from '../api/rest';

const ADMIN_TOKEN_STORAGE_KEY = 'randomcams_admin_token';

const REASON_LABELS: Record<string, string> = {
  NUDITY_OR_SEXUAL_CONTENT_WITHOUT_CONSENT: 'Non-consensual nudity / sexual content',
  SUSPECTED_MINOR: 'Suspected minor',
  HARASSMENT: 'Harassment or abuse',
  SCAM_OR_SOLICITATION: 'Scam or solicitation',
  OTHER: 'Other',
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
    <div style={{ maxWidth: 800, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Moderation queue</h2>
      <p style={{ fontSize: 12, color: '#666' }}>
        Reports here have NOT resulted in any account action yet. Review each one and choose
        Take action (bans the reported user) or Dismiss.
      </p>

      <form onSubmit={handleTokenSubmit}>
        <input
          type="password"
          placeholder="Admin token"
          value={adminToken}
          onChange={(e) => setAdminToken(e.target.value)}
        />
        <input
          placeholder="Your name (for the audit trail)"
          value={reviewerLabel}
          onChange={(e) => setReviewerLabel(e.target.value)}
        />
        <button type="submit">Load reports</button>
      </form>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {reports && reports.length === 0 && <p>No pending reports.</p>}

      {reports?.map((report) => (
        <div key={report.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, margin: '12px 0' }}>
          <p>
            <strong>{REASON_LABELS[report.reason] ?? report.reason}</strong>
            {report.note && <> — "{report.note}"</>}
          </p>
          <p style={{ fontSize: 13 }}>
            Reported: {report.reportedUser.displayName} ({report.reportedUser.email},{' '}
            {report.reportedUser.verifiedGender ?? 'unverified'})
            <br />
            Reporter: {report.reporter.displayName} ({report.reporter.email})
            <br />
            Session: {report.sessionId} · Filed {new Date(report.createdAt).toLocaleString()}
          </p>
          <button onClick={() => handleResolve(report.id, 'ACTION_TAKEN')}>Take action (ban)</button>{' '}
          <button onClick={() => handleResolve(report.id, 'DISMISSED')}>Dismiss</button>
        </div>
      ))}
    </div>
  );
}
