import { Link } from 'react-router-dom';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      metaTitle="Privacy Policy | Tsundoku"
      metaDescription="How Tsundoku collects, uses and protects your personal data, and how to exercise your GDPR rights."
      canonicalPath="/privacy"
      lastUpdated="15 August 2026"
    >
      <LegalSection heading="Who we are">
        <p>
          Tsundoku is a Japanese reading app and is the data controller for the personal data described below. You can
          reach us at{' '}
          <a className="font-medium text-accent underline underline-offset-4" href="mailto:thetsundokuapp@gmail.com">
            thetsundokuapp@gmail.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="What we collect">
        <p>We only collect what the app needs to work:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Account data</strong>: your email address and the authentication data required to sign you in.
          </li>
          <li>
            <strong>Learning data</strong>: your reading progress, saved words, saved grammar points, flashcard review
            history and app preferences.
          </li>
          <li>
            <strong>Subscription data</strong>: your plan, its status and its renewal date, so we know what your account
            has access to.
          </li>
        </ul>
        <p>
          Card and payment details are handled directly by our payment provider and never reach our servers. We run no
          advertising, tracking or analytics.
        </p>
      </LegalSection>

      <LegalSection heading="Why we use it">
        <p>
          Your data is used solely to provide the service you asked for: keeping you signed in, saving your progress,
          syncing it across your devices and managing your subscription. The legal basis is the performance of our
          contract with you (Article 6(1)(b) GDPR), and our legal obligations for billing records (Article 6(1)(c)
          GDPR).
        </p>
      </LegalSection>

      <LegalSection heading="Where it is stored">
        <p>
          Your account and learning data are stored on our managed cloud backend, hosted in the European Union region of
          our platform provider. A copy is also kept locally in your browser so the app works quickly and offline.
        </p>
      </LegalSection>

      <LegalSection heading="Third parties">
        <p>We rely on a small number of service providers to run Tsundoku:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>our hosting and backend provider, which stores your account and learning data on our behalf;</li>
          <li>our payment provider, which processes subscription payments and holds your billing details;</li>
          <li>
            dictionary, translation and AI services used to generate word definitions, example sentences and sentence
            translations. Only the Japanese word or sentence being looked up is sent to them, never your identity,
            email or account data.
          </li>
        </ul>
        <p>We never sell your data and we never share it for advertising.</p>
      </LegalSection>

      <LegalSection heading="How long we keep it">
        <p>
          We keep your data for as long as your account exists. You can delete your account at any time from{' '}
          <Link className="font-medium text-accent underline underline-offset-4" to="/settings">
            Settings
          </Link>
          ; deletion is immediate and permanent, and removes your account together with your progress, flashcards and
          saved grammar. Billing records are kept for as long as accounting law requires.
        </p>
      </LegalSection>

      <LegalSection heading="Cookies and local storage">
        <p>
          Tsundoku uses only strictly necessary storage: a session token to keep you signed in, and local storage for
          your reading progress and preferences. There are no advertising, analytics or tracking cookies, so no consent
          banner is required.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          Under the GDPR you have the right to access, rectify, erase and port your data, to restrict or object to its
          processing, and to withdraw consent where processing is based on consent. Write to{' '}
          <a className="font-medium text-accent underline underline-offset-4" href="mailto:thetsundokuapp@gmail.com">
            thetsundokuapp@gmail.com
          </a>{' '}
          and we will respond within one month.
        </p>
        <p>
          If you believe your data is not handled properly, you may lodge a complaint with the data protection authority
          of your country of residence.
        </p>
      </LegalSection>


      <LegalSection heading="Changes to this policy">
        <p>
          We may update this policy as the app evolves. The date at the top always reflects the latest version, and
          significant changes will be announced in the app.
        </p>
      </LegalSection>

      <p className="px-1 text-center text-xs text-muted-foreground">
        See also our{' '}
        <Link className="font-medium text-accent underline underline-offset-4" to="/terms">
          Terms of Service
        </Link>
        .
      </p>
    </LegalPage>
  );
}
