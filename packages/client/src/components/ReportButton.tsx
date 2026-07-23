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

  if (sent) return <p>Report submitted. Our team reviews reports before any account action.</p>;

  return (
    <div>
      <button onClick={() => setOpen((v) => !v)}>Report</button>
      {open && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {REASONS.map((r) => (
            <li key={r.value}>
              <button onClick={() => submit(r.value)}>{r.label}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
