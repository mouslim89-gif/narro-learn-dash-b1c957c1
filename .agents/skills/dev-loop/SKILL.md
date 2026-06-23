---
name: dev-loop
description: Un cycle de développement autonome qui analyse, planifie, code et résume les progrès.
---
# Skill : Dev-Loop (Développement Autonome)

Ce skill permet à l'agent de prendre l'initiative du développement en suivant une boucle itérative. Il est conçu pour faire progresser l'application de manière autonome tout en gardant l'utilisateur informé.

## Processus d'exécution

### 1. Analyse (Lecture du Codebase)
L'agent doit commencer par une exploration approfondie du projet :
- Lister les fichiers et répertoires pour comprendre la structure.
- Lire les fichiers clés (`package.json`, `App.tsx`, routes, composants principaux).
- Identifier les fonctionnalités déjà implémentées.
- Repérer les "trous" ou les fonctionnalités manquantes (ex: pas de gestion d'erreurs, UI incomplète, manque de feedback utilisateur, etc.).

### 2. Priorisation (Choix de la Feature)
Sur la base de l'analyse, l'agent doit choisir la **prochaine fonctionnalité la plus utile**. 
Critères de choix :
- Valeur ajoutée pour l'utilisateur.
- Faisabilité immédiate.
- Cohérence avec le reste de l'application.

### 3. Implémentation (Coding)
- Créer un plan détaillé avec `plan--create`.
- Implémenter la fonctionnalité en modifiant ou créant les fichiers nécessaires.
- S'assurer que le code respecte les standards du projet (Tailwind, TypeScript, Lucide React, etc.).

### 4. Bilan et Projection
Une fois l'implémentation terminée, l'agent doit :
- Résumer ce qui a été fait.
- Lister les tâches restantes ou les prochaines étapes logiques.
- Demander à l'utilisateur s'il souhaite relancer la boucle (`dev-loop`).

## Instructions pour l'Agent
- Garde un ton professionnel et proactif.
- Ne fais pas de changements massifs sans un plan clair.
- Teste visuellement ou via console si possible après chaque étape majeure.
