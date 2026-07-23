import { DISPLAYED_TOS_VERSION } from '../legalVersion';
import { LegalPage } from './LegalPage';

export function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" version={DISPLAYED_TOS_VERSION}>
      <h2>1. What we collect</h2>
      <ul>
        <li><strong>Account data:</strong> email address, display name, hashed password (or a Google account identifier if you sign in with Google).</li>
        <li>
          <strong>Verification data:</strong> your gender and date of birth as extracted from a
          government ID by our identity-verification provider. [Placeholder — once a real vendor
          is integrated, specify here whether raw ID images/video are stored by us or only by the
          vendor, and for how long. As built, this app's own database stores only the extracted
          gender/birthdate result and a reference ID to the verification session, not document
          images.]
        </li>
        <li><strong>Session/matching data:</strong> who you were matched with and when, for safety and moderation purposes.</li>
        <li><strong>Moderation data:</strong> reports you file or that are filed against you, and any associated evidence collected at the time of a report.</li>
        <li><strong>Technical data:</strong> IP address (used for basic abuse/rate-limit protection), browser/device information.</li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To operate the core service: verifying you're an adult, matching you with other verified users by gender preference, and connecting your video call.</li>
        <li>To review reports and enforce our Terms of Service.</li>
        <li>To meet legal obligations — for example, retaining age-verification records as required by law, and reporting suspected child sexual abuse material to the applicable authority (e.g. NCMEC in the US) where legally required.</li>
        <li>To maintain basic security (rate limiting, fraud/abuse prevention).</li>
      </ul>

      <h2>3. Who we share it with</h2>
      <ul>
        <li>Our identity-verification provider, to perform the ID check itself.</li>
        <li>Our hosting/infrastructure providers, to run the service.</li>
        <li>Law enforcement or child-safety authorities, where legally required (see above).</li>
        <li>[Placeholder — payment processor, once integrated, and any analytics/error-monitoring vendors.]</li>
      </ul>
      <p>We do not sell your personal data.</p>

      <h2>4. Data retention</h2>
      <p>
        [Placeholder — specific retention periods need to be set with counsel, particularly for
        age-verification records, which may be subject to a legally mandated minimum retention
        period rather than a maximum.]
      </p>

      <h2>5. Your rights</h2>
      <p>
        Depending on where you live, you may have rights to access, correct, or delete your
        personal data, or to object to certain processing. [Placeholder — final language should
        reference GDPR/CCPA or other applicable frameworks by name once launch jurisdictions are
        confirmed, and describe the actual request process.] Note that some data — particularly
        age-verification and moderation records — may need to be retained even after a deletion
        request where we have a legal obligation to keep it.
      </p>

      <h2>6. Cookies and local storage</h2>
      <p>
        We use browser local storage to keep you signed in (a session token) and to remember your
        preferences. We don't currently use third-party advertising/tracking cookies.
      </p>

      <h2>7. Children's privacy</h2>
      <p>
        This service is strictly for adults. We do not knowingly collect data from anyone under
        18, and every account must pass ID-based age verification before it can be used to match
        with anyone.
      </p>

      <h2>8. Security</h2>
      <p>
        Passwords are hashed, not stored in plain text. Access to moderation tooling is
        restricted. [Placeholder — expand with your actual security posture once production
        infrastructure, encryption-at-rest, and access-control details are finalized.]
      </p>

      <h2>9. International data transfers</h2>
      <p>[Placeholder — depends on where infrastructure and any vendors are located relative to your users.]</p>

      <h2>10. Changes to this policy</h2>
      <p>We may update this policy; material changes will be reflected in the version at the top of this page.</p>

      <h2>11. Contact</h2>
      <p>[Placeholder — privacy contact address / data protection officer if applicable.]</p>
    </LegalPage>
  );
}
