---
name: qa-continu
description: Scan itératif de l'application Tsundoku pour identifier, prioriser puis corriger bugs, edge cases et états cassés, avec validation de l'utilisateur avant toute correction.
---
# Skill : QA Continu

Ce skill assure une qualité irréprochable de l'application Tsundoku via un cycle de test et de correction systématique.

## Quand utiliser ce skill
- Quand l'utilisateur veut stabiliser l'application.
- Pour faire un bilan de santé avant une mise en production (Publish).
- Quand l'utilisateur invoque explicitement "qa-continu".

## Processus Itératif

### 1. Diagnostic (Scan)
- **Console & erreurs runtime** : `code--read_runtime_errors`, `code--read_console_logs`, `code--read_network_requests`.
- **Analyse statique** : `rg -n "TODO|FIXME|XXX" src/` et un typecheck `tsgo`.
- **Vérification UI** : piloter Playwright depuis le shell (scripts sous `/tmp/browser/`, dev server déjà lancé sur `http://localhost:8080`, viewport mobile ~453x681) et capturer des screenshots des pages :
  `/` (library), `/my-books`, `/flashcards`, `/dictionary`, `/dictionary/:word`, `/grammar/:id`, `/book/:id`, `/reader/:id/:difficulty`, `/settings`.
  Restaurer la session Supabase si `LOVABLE_BROWSER_AUTH_STATUS=injected` (toutes les routes sont protégées).
- **Base de données** : vérifier avec `psql` que les caches sont bien remplis (`dictionary`, `example_sentences`, `sentence_translations`, `grammar_examples`) — un cache vide = des crédits IA brûlés à l'usage.
- **Edge cases** : zéro donnée (aucune flashcard, aucun livre commencé), textes très longs, livre sans audio, mot sans phrase d'exemple, mode sombre, hors-ligne.

### 2. Rapport de QA
Compiler une liste priorisée :
- **BLOQUANT** : l'app crash ou une fonction vitale est cassée.
- **MAJEUR** : problème fonctionnel gênant l'utilisateur.
- **MINEUR** : glitch graphique, texte manquant, incohérence UI.
- **OPTIMISATION** : performance, coût IA, accessibilité.

### 3. Approbation Utilisateur
**OBLIGATOIRE** : présenter la liste via `ask_questions` avant toute action. L'utilisateur valide les points à corriger.

### 4. Correction & Vérification
- Appliquer uniquement les corrections validées.
- Re-vérifier via Playwright / la console que le bug est résolu sans régression.

### 5. Nouvelle Itération
Proposer explicitement de relancer un scan pour l'itération suivante.

## Principes Fondamentaux
- **Rigueur** : ne pas ignorer les petits détails (contrastes, alignements, états vides).
- **Fidélité au thème** : palette papier chaude, titres Merriweather, `tap-scale`/`card-lift`, pas de hover (app mobile), pas de barres d'accent ambre verticales.
- **UI en anglais** : tout texte affiché à l'utilisateur doit être en anglais.
- **Prudence** : ne jamais corriger en masse sans validation point par point.
