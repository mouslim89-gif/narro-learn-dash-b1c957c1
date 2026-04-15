

## Plan : phrase de contexte + bouton flashcard explicite

### Résumé
1. Quand un mot est ajouté depuis le Reader (WordPopup), sauvegarder la phrase de l'histoire dans laquelle il apparaît
2. Sur le verso de la flashcard, afficher cette phrase de contexte en plus de la phrase Tatoeba
3. Rendre le bouton "Save" plus explicite → "Add to Flashcards"

### Changements

#### 1. `src/stores/flashcards.ts` — Ajouter le champ `contextSentence`
- Ajouter `contextSentence?: string` à l'interface `SavedWord`
- Aucun changement à `addWord`, le champ est simplement optionnel

#### 2. `src/pages/Reader.tsx` — Passer la phrase de contexte au WordPopup
- Quand un mot est cliqué, trouver la phrase (`sentence.tokens`) qui contient ce token
- Joindre les tokens de cette phrase en texte et le passer au WordPopup via une nouvelle prop `contextSentence`

#### 3. `src/components/WordPopup.tsx` — Recevoir et sauvegarder le contexte
- Ajouter prop `contextSentence?: string`
- L'inclure dans l'objet `SavedWord` passé à `addWord`
- Changer le bouton de `Save` / `Saved` → `Add to Flashcards` / `Added to Flashcards` (avec icône Star conservée)

#### 4. `src/pages/Flashcards.tsx` — Afficher les deux phrases
- Garder `<ExampleSentence word={card.word} />` (Tatoeba)
- Si `card.contextSentence` existe, afficher au-dessus un bloc "From your reading" avec la phrase de l'histoire, stylé différemment (icône livre, fond légèrement teinté)

### Fichiers modifiés
| Fichier | Changement |
|---------|-----------|
| `src/stores/flashcards.ts` | Ajouter `contextSentence?: string` |
| `src/pages/Reader.tsx` | Extraire et passer la phrase de contexte |
| `src/components/WordPopup.tsx` | Nouvelle prop + bouton renommé |
| `src/pages/Flashcards.tsx` | Afficher phrase de contexte + Tatoeba |

