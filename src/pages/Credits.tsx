import { Link } from 'react-router-dom';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';

const linkClass = 'font-medium text-accent underline underline-offset-4';

function Source({
  name,
  use,
  licence,
  licenceHref,
  sourceHref,
}: {
  name: string;
  use: string;
  licence: string;
  licenceHref: string;
  sourceHref: string;
}) {
  return (
    <li className="space-y-1">
      <a className={linkClass} href={sourceHref} target="_blank" rel="noreferrer noopener">
        {name}
      </a>
      <p className="text-sm text-muted-foreground">{use}</p>
      <p className="text-xs text-muted-foreground">
        Licence:{' '}
        <a className={linkClass} href={licenceHref} target="_blank" rel="noreferrer noopener">
          {licence}
        </a>
      </p>
    </li>
  );
}

export default function Credits() {
  return (
    <LegalPage
      title="Credits & licences"
      metaTitle="Credits & Licences | Tsundoku"
      metaDescription="The dictionaries, corpora, texts, fonts and open-source projects that Tsundoku is built on, with their licences."
      canonicalPath="/credits"
      lastUpdated="15 August 2026"
      eyebrow="About"
    >
      <LegalSection heading="Language data">
        <p>
          Tsundoku would not exist without the volunteer projects below. Their data is used under the licences shown,
          and any modified or derived data we publish stays under the same terms.
        </p>
        <ul className="space-y-4 pt-1">
          <Source
            name="JMdict / JMnedict (EDRDG)"
            use="Word definitions, readings and part-of-speech data, accessed through Jisho."
            licence="CC BY-SA 4.0"
            licenceHref="https://creativecommons.org/licenses/by-sa/4.0/"
            sourceHref="https://www.edrdg.org/jmdict/j_jmdict.html"
          />
          <Source
            name="KANJIDIC2 (EDRDG)"
            use="Kanji details: meanings, on and kun readings, stroke counts and JLPT levels."
            licence="CC BY-SA 4.0"
            licenceHref="https://creativecommons.org/licenses/by-sa/4.0/"
            sourceHref="https://www.edrdg.org/wiki/index.php/KANJIDIC_Project"
          />
          <Source
            name="Tatoeba Project"
            use="Example sentences and their English translations."
            licence="CC BY 2.0 FR"
            licenceHref="https://creativecommons.org/licenses/by/2.0/fr/"
            sourceHref="https://tatoeba.org/"
          />
          <Source
            name="Aozora Bunko"
            use="The original Japanese literary works read in the app, all in the public domain."
            licence="Public domain"
            licenceHref="https://www.aozora.gr.jp/guide/kijyunn.html"
            sourceHref="https://www.aozora.gr.jp/"
          />
          <Source
            name="Jisho.org"
            use="Dictionary lookup service used to retrieve entries built on the EDRDG data above."
            licence="EDRDG terms"
            licenceHref="https://www.edrdg.org/edrdg/licence.html"
            sourceHref="https://jisho.org/about"
          />
        </ul>
      </LegalSection>

      <LegalSection heading="Adapted texts">
        <p>
          The simplified and intermediate versions of each story, the tokenisation, the furigana, the grammar notes and
          the sentence translations are produced by Tsundoku on top of the public-domain originals. They are provided
          for personal study and remain the property of Tsundoku.
        </p>
      </LegalSection>

      <LegalSection heading="Software">
        <ul className="space-y-4 pt-1">
          <Source
            name="Kuromoji"
            use="Japanese morphological analysis, used to split sentences into words."
            licence="Apache License 2.0"
            licenceHref="https://www.apache.org/licenses/LICENSE-2.0"
            sourceHref="https://github.com/takuyaa/kuromoji.js"
          />
          <Source
            name="WanaKana"
            use="Kana and romaji conversion utilities."
            licence="MIT"
            licenceHref="https://opensource.org/licenses/MIT"
            sourceHref="https://github.com/WaniKani/WanaKana"
          />
          <Source
            name="React, Vite, Tailwind CSS, Radix UI, Framer Motion"
            use="The application framework, build tooling, styling and interface components."
            licence="MIT"
            licenceHref="https://opensource.org/licenses/MIT"
            sourceHref="https://react.dev/"
          />
          <Source
            name="Lucide"
            use="The icon set used throughout the interface."
            licence="ISC"
            licenceHref="https://opensource.org/licenses/ISC"
            sourceHref="https://lucide.dev/"
          />
        </ul>
      </LegalSection>

      <LegalSection heading="Typefaces">
        <p>
          Merriweather, Inter, Noto Sans JP, Noto Serif JP and Klee One are used under the{' '}
          <a
            className={linkClass}
            href="https://openfontlicense.org/"
            target="_blank"
            rel="noreferrer noopener"
          >
            SIL Open Font License 1.1
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="Something missing?">
        <p>
          If you spot an attribution we owe you, write to{' '}
          <a className={linkClass} href="mailto:thetsundokuapp@gmail.com">
            thetsundokuapp@gmail.com
          </a>{' '}
          and we will correct this page.
        </p>
      </LegalSection>

      <p className="px-1 text-center text-xs text-muted-foreground">
        See also our{' '}
        <Link className={linkClass} to="/terms">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link className={linkClass} to="/privacy">
          Privacy Policy
        </Link>
        .
      </p>
    </LegalPage>
  );
}
