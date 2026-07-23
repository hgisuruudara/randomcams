import { useState } from 'react';
import { Socket } from 'socket.io-client';
import { ModerationReportReason } from '@randomcams/shared';

const REASONS: { value: ModerationReportReason; label: string }[] = [
  { value: 'nudity_or_sexual_content_without_consent', label: 'Non-consensual nudity / sexual content' },
  { value: 'suspected_minor', label: 'I believe this person may be a minor' },
  { value: 'harassment', label: 'Harassment or abuse' },
  { value: 'scam_or_solicitation', label: 'Scam or solicitation' },
  { value: 'other', label: 'Other' },
];

export function ReportButton({
  socket,
  sessionId,
  reportedUserId,
}: {
  socket: Socket | null;
  sessionId: string;
  reportedUserId: string;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  function submit(reason: ModerationReportReason) {
    socket?.emit('report', { sessionId, reportedUserId, reason });
    setSent(true);
    setOpen(false);
  }

  if (sent) {
    return (
      <p className="rounded-2xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
        Report submitted. Our team reviews reports before any account action.
      </p>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="btn-secondary">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
            clipRule="evenodd"
          />
        </svg>
        Report
      </button>
      {open && (
        <div className="card absolute bottom-full left-0 z-10 mb-2 w-72 overflow-hidden p-1.5">
          {REASONS.map((r) => (
            <button
              key={r.value}
              onClick={() => submit(r.value)}
              className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:text-slate-300 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
