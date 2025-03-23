# Architecture de Vocatio

Ce document décrit l'architecture technique de l'application Vocatio, expliquant les choix de conception et la structure du projet.

## Vue d'ensemble

Vocatio est une application frontend sans backend qui permet aux utilisateurs d'optimiser leur CV et de générer des lettres de motivation personnalisées. L'application utilise l'API Claude d'Anthropic pour l'analyse et la génération de contenu, tout en traitant les documents entièrement côté client pour une sécurité maximale des données.

## Stack technique

- **Framework**: React 18 + Next.js 14+
- **Langage**: TypeScript
- **Styles**: Tailwind CSS
- **Gestion d'état**: Zustand
- **Traitement de documents**: PDF.js, mammoth.js, jsPDF
- **IA/NLP**: API Anthropic Claude via Vercel Edge Functions
- **Déploiement**: Vercel avec CI/CD GitHub
- **Tests**: Jest + React Testing Library

## Structure du projet

```
vocatio/
├── public/              # Fichiers statiques
├── src/
│   ├── components/      # Composants React
│   │   ├── common/      # Composants réutilisables
│   │   ├── cv/          # Composants liés aux CV
│   │   ├── job/         # Composants liés aux offres d'emploi
│   │   ├── matcher/     # Composants d'analyse d'adéquation
│   │   ├── letter/      # Composants liés aux lettres de motivation
│   │   └── export/      # Composants liés à l'exportation
│   ├── hooks/           # Custom hooks React
│   ├── lib/             # Fonctions et utilitaires
│   │   ├── api/         # Intégrations API
│   │   ├── document-processing/ # Traitement de documents
│   │   └── utils/       # Fonctions utilitaires
│   ├── pages/           # Pages Next.js
│   │   └── api/         # API Routes (Edge Functions)
│   ├── store/           # Gestion d'état global (Zustand)
│   ├── styles/          # Styles CSS
│   ├── types/           # Types TypeScript
│   └── config/          # Configuration
├── tests/               # Tests
└── [...config files]    # Fichiers de configuration divers
```

## Flux de données

1. **Import de documents**:
   - Les documents (CV, offres d'emploi) sont traités localement via les bibliothèques PDF.js et mammoth.js
   - Aucune donnée n'est envoyée à des serveurs externes pour le traitement initial
   - Les informations extraites sont stockées dans le store Zustand

2. **Analyse et génération**:
   - Les données structurées sont envoyées à l'API Claude via Vercel Edge Functions
   - L'Edge Function sert de proxy pour protéger la clé API
   - Les résultats de l'analyse sont stockés dans le store Zustand

3. **Exportation**:
   - Les documents finaux sont générés côté client via jsPDF
   - Aucune donnée n'est stockée sur des serveurs externes

## Principes architecturaux

### 1. Approche "client-first"

Toutes les opérations sensibles sont effectuées côté client pour protéger la confidentialité des données des utilisateurs. Nous n'envoyons à l'API Claude que les informations nécessaires pour l'analyse et la génération.

### 2. Isolation des composants

L'application suit une architecture de composants modulaires avec une séparation claire des responsabilités:
- Chaque fonctionnalité est isolée dans son propre module
- Les composants communs sont réutilisables dans toute l'application
- La logique métier est séparée de la présentation

### 3. Gestion d'état centralisée

Zustand est utilisé pour gérer l'état global de l'application:
- Stores séparés pour chaque domaine (CV, offre d'emploi, analyse, lettre)
- Persistence locale pour permettre la reprise du travail
- Actions clairement définies pour les modifications d'état

### 4. API Boundaries

Les interactions avec des services externes sont encapsulées dans des modules dédiés:
- `/lib/api/claude.ts` gère toutes les interactions avec l'API Claude
- `/pages/api/claude.ts` implémente l'Edge Function sécurisée

## Décisions techniques

### Choix de Zustand vs Redux
Zustand a été choisi pour sa simplicité et sa légèreté, adaptées à la taille de l'application, tout en offrant des fonctionnalités puissantes comme la persistance.

### Traitement de documents côté client
Pour garantir la confidentialité des données, tous les documents sont traités localement. Cela évite d'envoyer des informations sensibles à des serveurs tiers.

### Vercel Edge Functions
Les Edge Functions permettent d'intégrer l'API Claude sans exposer la clé API au client, tout en bénéficiant de la rapidité et de la proximité géographique des CDN.

### Architecture orientée composants
L'utilisation intensive de composants React modulaires facilite la maintenance et l'évolution de l'application, permettant des modifications ciblées sans affecter l'ensemble du système.

## Sécurité

- Aucun stockage permanent des données utilisateur
- Traitement des documents entièrement côté client
- Protection des clés API via les variables d'environnement Vercel
- Validation des inputs pour prévenir les injections
- Headers de sécurité configurés dans vercel.json