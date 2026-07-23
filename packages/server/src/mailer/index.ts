import { logger } from '../logger';

export interface Mailer {
  send(to: string, subject: string, body: string): Promise<void>;
}

// Local-development stand-in: logs instead of sending. Swap for a real
// provider (SES, Postmark, SendGrid, ...) before deploying anywhere - email
// verification and password reset are both useless if the mail never
// arrives.
class ConsoleMailer implements Mailer {
  async send(to: string, subject: string, body: string): Promise<void> {
    logger.info({ to, subject, body }, 'mailer: would send email');
  }
}

let mailer: Mailer | null = null;

export function getMailer(): Mailer {
  if (!mailer) mailer = new ConsoleMailer();
  return mailer;
}

// Test-only seam: lets tests install a capturing mailer instead of the
// console one, so they can recover the real token from a "sent" email
// rather than needing a backdoor into the hashed DB column.
export function setMailer(replacement: Mailer): void {
  mailer = replacement;
}
