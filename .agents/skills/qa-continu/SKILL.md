---
name: qa-continu
description: Scan itératif de l'application pour identifier et corriger les bugs, edge cases et états cassés.
---
# Skill : QA Continu

Ce skill permet d'assurer une qualité irréprochable de l'application Tsundoku via un cycle de test et de correction systématique.

## Quand utiliser ce skill
- Quand l'utilisateur veut stabiliser l'application.
- Pour faire un bilan de santé avant une mise en production (Publish).
- Quand l'utilisateur invoque explicitement "qa-continu".

## Processus Itératif

### 1. Diagnostic (Scan)
L'agent doit scanner les aspects suivants :
- **Console & Erreurs** : Utiliser `code--read_runtime_errors` et `code--read_console_logs`.
- **Analyse Statique** : Rechercher des commentaires "TODO", "FIXME", ou des erreurs de type via `rg`.
- **Vérification UI** : Utiliser `browser--view_preview` pour visiter les pages `/`, `/flashcards`, `/settings`.
- **Edge Cases** : Vérifier le comportement avec zéro donnée (ex: pas de flashcards), des textes très longs, ou des fichiers audio manquants.

### 2. Rapport de QA
Compiler une liste priorisée :
- **BLOQUANT** : L'app crash ou une fonction vitale est cassée.
- **MAJEUR** : Problème fonctionnel gênant l'utilisateur.
- **MINEUR** : Glitch graphique, texte manquant, incohérence UI.
- **OPTIMISATION** : Performance, accessibilité.

### 3. Approbation Utilisateur
**OBLIGATOIRE** : Présenter la liste via `ask_questions` avant toute action. L'utilisateur doit valider les points à corriger.

### 4. Correction & Vérification
- Appliquer les corrections validées.
- Vérifier via le preview que le bug est résolu sans régression.

### 5. Nouvelle Itération
Une fois terminé, proposer explicitement de relancer un scan pour l'itération suivante.

## Principes Fondamentaux
- **Rigueur** : Ne pas ignorer les petits détails (ex: contrastes, alignements).
- **Communication** : Expliquer clairement l'impact de chaque bug identifié.
- **Prudence** : Ne jamais corriger en masse sans validation point par point.
