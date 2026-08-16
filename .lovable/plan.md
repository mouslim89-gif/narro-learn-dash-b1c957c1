# Grammar note shortcut in the word mini popup

When a tapped word belongs to a sentence covered by a grammar note, show a small grammar button in the mini popup that opens the Grammar Notes panel directly on that note.

## Behaviour

- The button appears only when the tapped sentence matches a grammar note of the current chapter/part. Otherwise nothing is added (no dead button).
- Tapping it closes the mini popup and opens the Grammar Notes drawer with the matching note already expanded and scrolled into view.
- If that note is locked for free users (only the first note is free today), tapping still opens the panel and triggers the existing premium prompt, exactly like tapping the locked row in the panel.

## Placement options

1. Recommended: an icon button right after the star, same 28px round style as the star (`BookType` icon, amber accent tint when available). Keeps the header rhythm: word, audio, star, grammar, then Translate / More on the right.
2. Grouped on the right, next to the Translate icon, so all "sentence level" actions sit together and the star stays alone as the "word level" action.
3. A small text chip under the definitions ("Grammar: ～ておく") that names the pattern. More explicit, but taller popup.

## Matching logic

Grammar notes carry an `example` string that is an excerpt of the chapter text. A note matches the tapped sentence when the normalized sentence contains the normalized example, or the example contains the sentence (normalization: strip whitespace and trailing 。/、). First match wins, following the same order the panel uses.

## Technical changes

- `src/pages/Reader.tsx`: compute the note list for the current part with `getGrammarForPart` / `getGrammarFlat` (memoized, no network, no AI), resolve the match for `miniPopup.contextSentence`, pass `grammarPattern` and `onShowGrammar` to `WordMiniPopup`. `onShowGrammar` closes the mini popup, stores the target example in state, and opens `GrammarPanel`.
- `src/components/WordMiniPopup.tsx`: new optional props `grammarPattern?: string` and `onShowGrammar?: () => void`; render the button only when both are set.
- `src/components/GrammarPanel.tsx`: new optional `focusExample?: string` prop. On open, expand the note whose example matches and scroll its card into view (ref map + `scrollIntoView({ block: 'center' })`); if that note is locked, call `requirePremium('grammar-notes')` instead of expanding. Reset the focus once consumed so normal opens behave as before.

No backend, data, or cost impact: everything reads the prebaked `book-grammar` data already in the bundle.
