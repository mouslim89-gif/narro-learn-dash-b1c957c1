import { Link } from 'react-router-dom';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';

const linkClass = 'font-medium text-accent underline underline-offset-4';

export default function Support() {
  return (
    <LegalPage
      title="Support"
      metaTitle="Support | Tsundoku"
      metaDescription="Get help with Tsundoku: contact the developer, report a bug or a wrong definition, and manage your account."
      canonicalPath="/support"
      lastUpdated="15 August 2026"
      eyebrow="Help"
    >
      <LegalSection heading="Contact">
        <p>
          Tsundoku is made by one person. Write to{' '}
          <a className={linkClass} href="mailto:thetsundokuapp@gmail.com">
            thetsundokuapp@gmail.com
          </a>{' '}
          and you will normally get an answer within a few days.
        </p>
      </LegalSection>

      <LegalSection heading="Reporting a bug">
        <p>Send an email with:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>what you were doing and what happened instead;</li>
          <li>the book, chapter or word involved;</li>
          <li>your device and browser, and a screenshot if you have one.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="A definition or reading looks wrong">
        <p>
          Definitions and readings come from open dictionaries, and example sentences come from a volunteer corpus, so
          mistakes happen. Send the word and what you expected, and it will be corrected in the app.
        </p>
      </LegalSection>

      <LegalSection heading="Subscription and billing">
        <p>
          Subscriptions bought inside the mobile app are handled by the App Store or Google Play: manage or cancel them
          from your store account settings, and request refunds through the store. For subscriptions bought on the web,
          write to the address above.
        </p>
      </LegalSection>

      <LegalSection heading="Account and data">
        <p>
          You can delete your account and all of its data at any time. See{' '}
          <Link className={linkClass} to="/account-deletion">
            Account deletion
          </Link>{' '}
          for the exact steps and what gets erased.
        </p>
      </LegalSection>

      <p className="px-1 text-center text-xs text-muted-foreground">
        See also our{' '}
        <Link className={linkClass} to="/terms">
          Terms of Service
        </Link>
        ,{' '}
        <Link className={linkClass} to="/privacy">
          Privacy Policy
        </Link>{' '}
        and{' '}
        <Link className={linkClass} to="/credits">
          Credits
        </Link>
        .
      </p>
    </LegalPage>
  );
}
