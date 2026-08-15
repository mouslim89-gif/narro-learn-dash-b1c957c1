import { Link } from 'react-router-dom';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      metaTitle="Terms of Service | Tsundoku"
      metaDescription="The terms that govern your use of Tsundoku, the Japanese graded reading app."
      canonicalPath="/terms"
      lastUpdated="15 August 2026"
    >
      <LegalSection heading="1. Who we are">
        <p>
          Tsundoku (&quot;we&quot;, &quot;us&quot;) is a Japanese reading app. Contact:{' '}
          <a className="font-medium text-accent underline underline-offset-4" href="mailto:thetsundokuapp@gmail.com">
            thetsundokuapp@gmail.com
          </a>
          . By creating an account or using the app, you agree to these terms.
        </p>
      </LegalSection>

      <LegalSection heading="2. Eligibility">
        <p>
          You must be at least 16 years old to create an account. If you use Tsundoku on behalf of an organisation, you
          confirm you are allowed to accept these terms for it.
        </p>
      </LegalSection>

      <LegalSection heading="3. Your account">
        <p>
          You are responsible for keeping your credentials confidential and for everything that happens under your
          account. Tell us immediately if you suspect unauthorised access. You can delete your account at any time from
          Settings; deletion is permanent.
        </p>
      </LegalSection>

      <LegalSection heading="4. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>break the law or infringe anyone&apos;s rights while using the app;</li>
          <li>attempt to access other users&apos; data, or probe, disrupt or overload our systems;</li>
          <li>scrape, copy or redistribute the app&apos;s content at scale, or resell access to it;</li>
          <li>reverse engineer the app except where the law expressly allows it.</li>
        </ul>
        <p>We may suspend or terminate accounts that breach these rules.</p>
      </LegalSection>

      <LegalSection heading="5. Content and intellectual property">
        <p>
          The literary works available in Tsundoku are public-domain Japanese texts. Everything else, including the app,
          its design, its adapted and graded texts, tokenisation, grammar notes and translations, belongs to Tsundoku or
          its licensors and is provided for your personal, non-commercial study only.
        </p>
        <p>
          Data you create (progress, flashcards, saved grammar) remains yours. You grant us the limited right to store
          and process it to run the service.
        </p>
      </LegalSection>

      <LegalSection heading="6. Subscriptions and billing">
        <p>
          Tsundoku offers a paid subscription that unlocks the full app. The price, billing period and included features
          are shown before you confirm your purchase, and payments are processed by our payment provider. Subscriptions
          renew automatically for the same period unless you cancel before the renewal date. Cancelling stops future
          charges and keeps your access until the end of the period you already paid for.
        </p>
        <p>
          Prices include applicable taxes where required. We may change prices for future billing periods and will tell
          you in advance so you can cancel if you disagree. Payments already made are not refunded on a pro rata basis
          unless the law requires it.
        </p>
        <p>
          <strong>EU right of withdrawal.</strong> As a consumer in the EU you normally have 14 days to withdraw from a
          purchase. By asking for immediate access to the paid digital content, you request that we begin performance
          during that period and acknowledge that you lose the right of withdrawal once the content has been fully
          supplied. Where the right still applies, write to us at the address above.
        </p>
      </LegalSection>

      <LegalSection heading="7. Availability and no warranty">
        <p>
          Tsundoku is provided &quot;as is&quot;. We do our best to keep it available and accurate, but we do not
          guarantee uninterrupted service, or that definitions, translations and grammar explanations, some of which are
          generated automatically, are free of errors. They are study aids, not authoritative language advice.
        </p>
      </LegalSection>

      <LegalSection heading="8. Liability">
        <p>
          To the extent permitted by law, we are not liable for indirect or consequential damage, lost data or lost
          profits arising from your use of the app. Nothing here limits liability that cannot be limited by law,
          including liability for fraud, death or personal injury, or your statutory consumer rights.
        </p>
      </LegalSection>

      <LegalSection heading="9. Termination">
        <p>
          You may stop using Tsundoku and delete your account at any time. We may suspend or end access if you breach
          these terms, or if we discontinue the service, in which case we will give reasonable notice where possible and
          refund any period you have paid for but cannot use.
        </p>
      </LegalSection>

      <LegalSection heading="10. Changes">
        <p>
          We may update these terms as the app evolves. The date at the top reflects the latest version, and material
          changes will be announced in the app. Continuing to use Tsundoku after a change means you accept it.
        </p>
      </LegalSection>

      <LegalSection heading="11. Governing law">
        <p>
          These terms are governed by the law applicable at our place of establishment, without affecting the mandatory
          consumer protections available to you in your country of residence, whose courts you may always turn to.
        </p>
      </LegalSection>

      <p className="px-1 text-center text-xs text-muted-foreground">
        See also our{' '}
        <Link className="font-medium text-accent underline underline-offset-4" to="/privacy">
          Privacy Policy
        </Link>
        .
      </p>
    </LegalPage>
  );
}
