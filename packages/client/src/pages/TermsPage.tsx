import { DISPLAYED_TOS_VERSION } from '../legalVersion';
import { LegalPage } from './LegalPage';

export function TermsPage() {
  return (
    <LegalPage title="Terms of Service" version={DISPLAYED_TOS_VERSION}>
      <h2>1. Who can use this service</h2>
      <p>
        This service is for adults only. You must be at least 18 years old to create an account,
        and you must complete identity verification (a government-ID check performed by our
        verification provider) before you can be matched with anyone. Your age and gender for
        matching purposes are taken only from that verification, never from what you type into a
        profile. There are no exceptions to the age requirement, including with parental consent.
      </p>

      <h2>2. What this service is</h2>
      <p>
        This is a random video chat service that pairs verified adult users for live video
        conversation. Conversations may include sexual content between consenting, verified
        adults. By using this service you acknowledge you may be shown or asked to view adult
        sexual content, and you consent to that possibility as a condition of use.
      </p>

      <h2>3. Prohibited conduct</h2>
      <p>The following are never permitted, regardless of consent between users:</p>
      <ul>
        <li>
          Any sexual content involving, or that could reasonably involve, a minor. This is
          zero-tolerance: accounts are suspended immediately on a credible report and matters are
          referred to law enforcement / the relevant child-safety reporting authority as required
          by law.
        </li>
        <li>Recording, screenshotting, or distributing another user's video/audio without their consent.</li>
        <li>Harassment, threats, or abusive conduct toward another user.</li>
        <li>Prostitution, solicitation, or other commercial sexual services facilitated through the platform. [Placeholder — scope depends on jurisdiction; counsel to confirm exact prohibited-conduct language for each launch market.]</li>
        <li>Impersonating another person, or misrepresenting your identity in a way that circumvents verification.</li>
        <li>Using the service for commercial purposes (advertising, solicitation, data scraping) without our written permission.</li>
      </ul>

      <h2>4. Reporting and enforcement</h2>
      <p>
        You can report another user during or after a session. Reports are reviewed by a human
        moderator before any account action is taken — we do not auto-ban an account off a single
        report. The one exception is a report that a user may be a minor: that report immediately
        and automatically suspends the reported account pending urgent review, because we treat
        that risk as too serious to leave queued.
      </p>
      <p>
        We may suspend or terminate any account, at our discretion, for violating these terms,
        including without prior notice where we believe it's necessary to protect users or comply
        with the law.
      </p>

      <h2>5. Monitoring disclosure</h2>
      <p>
        When you submit a report, we may retain related session metadata and moderation evidence
        for review. [Placeholder — the final language here depends on the specific evidence
        capture mechanism implemented and must accurately describe it; do not publish this section
        without confirming it matches what the product actually does.]
      </p>

      <h2>6. No warranty</h2>
      <p>
        The service is provided "as is." We do not guarantee the accuracy of any user's identity
        verification beyond what our verification provider attests, the availability of the
        service, or that you will not encounter content or conduct that violates these terms
        despite our safety measures.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        [Placeholder — standard limitation-of-liability language, indemnification, and dispute
        resolution/arbitration clauses need to be drafted by counsel and tailored to the launch
        jurisdiction(s).]
      </p>

      <h2>8. Governing law</h2>
      <p>[Placeholder — to be set once launch jurisdiction(s) are finalized.]</p>

      <h2>9. Changes to these terms</h2>
      <p>
        We may update these terms. Material changes will require re-acceptance before you can
        continue using the service.
      </p>

      <h2>10. Contact</h2>
      <p>[Placeholder — legal entity name and contact address.]</p>
    </LegalPage>
  );
}
