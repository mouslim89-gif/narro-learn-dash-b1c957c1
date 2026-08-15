import { Link } from 'react-router-dom';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';

const linkClass = 'font-medium text-accent underline underline-offset-4';

export default function AccountDeletion() {
  return (
    <LegalPage
      title="Account deletion"
      metaTitle="Delete your account | Tsundoku"
      metaDescription="How to permanently delete your Tsundoku account and all associated data, and what is erased or retained."
      canonicalPath="/account-deletion"
      lastUpdated="15 August 2026"
      eyebrow="Your data"
    >
      <LegalSection heading="Delete from the app">
        <p>
          Sign in, open <strong>Settings</strong>, scroll to the bottom and tap <strong>Delete account</strong>. You are
          asked to confirm once. The deletion is immediate and permanent, and you are signed out straight away.
        </p>
        <p>
          If you are signed in right now, you can go there directly:{' '}
          <Link className={linkClass} to="/settings">
            Settings
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection heading="Delete by email">
        <p>
          If you cannot sign in, send a deletion request from the email address of your account to{' '}
          <a className={linkClass} href="mailto:thetsundokuapp@gmail.com">
            thetsundokuapp@gmail.com
          </a>
          . The account is deleted within 30 days of the request, usually much sooner.
        </p>
      </LegalSection>

      <LegalSection heading="What is deleted">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>your account and sign-in credentials;</li>
          <li>your profile and app preferences;</li>
          <li>your reading progress and reading history;</li>
          <li>your saved words, flashcards and review history;</li>
          <li>your saved grammar points;</li>
          <li>any personal word or token corrections you saved.</li>
        </ul>
        <p>
          Data stored locally on your device is removed when you sign out and clear the app data from your browser or
          system settings.
        </p>
      </LegalSection>

      <LegalSection heading="What is kept">
        <p>
          Billing and invoice records tied to a paid subscription are kept for as long as accounting and tax law
          requires, then deleted. They are not used for anything else. Anonymous dictionary, example-sentence and
          translation caches contain no personal data and are not linked to you, so they remain.
        </p>
      </LegalSection>

      <LegalSection heading="Cancel your subscription first">
        <p>
          Deleting your account does not cancel a subscription bought through the App Store or Google Play. Cancel it in
          your store account settings before deleting, otherwise it keeps renewing.
        </p>
      </LegalSection>

      <p className="px-1 text-center text-xs text-muted-foreground">
        See also our{' '}
        <Link className={linkClass} to="/privacy">
          Privacy Policy
        </Link>{' '}
        and{' '}
        <Link className={linkClass} to="/support">
          Support
        </Link>
        .
      </p>
    </LegalPage>
  );
}
