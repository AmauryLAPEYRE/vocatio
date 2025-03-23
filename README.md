# Vocatio - Application d'optimisation de CV et génération de lettres de motivation

Vocatio est une application frontend qui permet aux utilisateurs d'optimiser leur CV et de générer des lettres de motivation personnalisées pour chaque offre d'emploi, en utilisant l'IA d'Anthropic Claude pour l'analyse et la génération de contenu.

## Fonctionnalités principales

- Import de CV existants (PDF, DOCX)
- Import d'offres d'emploi
- Analyse et mise en correspondance des compétences avec les exigences du poste
- Génération d'un CV optimisé conservant exactement le même format que l'original
- Génération de lettres de motivation avec différents styles d'écriture
- Export des documents finalisés en PDF

## Avantages clés

- Traitement 100% côté client sans stockage de données
- Respect absolu des informations originales (aucune falsification)
- Interface intuitive et professionnelle
- Optimisation pour différents types de postes

## Stack technique

- Frontend: React 18 + Next.js 14 + Tailwind CSS
- Gestion d'états: Zustand
- Traitement de documents: PDF.js, mammoth.js (DOCX), jsPDF
- IA/NLP: API Anthropic Claude via Vercel Edge Functions
- Déploiement: Vercel avec CI/CD GitHub
- Tests: Jest + React Testing Library

## Configuration et déploiement

### Prérequis

- Node.js 18+ et npm
- Compte Vercel
- Clé API Anthropic Claude

### Installation locale

1. Cloner le dépôt
   ```bash
   git clone https://github.com/votre-compte/vocatio.git
   cd vocatio
   ```

2. Installer les dépendances
   ```bash
   npm install
   ```

3. Configurer les variables d'environnement
   - Créer un fichier `.env.local` à la racine du projet
   - Ajouter votre clé API Anthropic: `ANTHROPIC_API_KEY=votre_clé_api`

4. Démarrer le serveur de développement
   ```bash
   npm run dev
   ```

5. L'application sera disponible à l'adresse [http://localhost:3000](http://localhost:3000)

### Déploiement sur Vercel

1. Connectez votre dépôt GitHub à Vercel
2. Configurez la variable d'environnement `ANTHROPIC_API_KEY` dans les paramètres du projet
3. Déployez l'application

## Utilisation

1. Importez votre CV (formats PDF ou DOCX)
2. Importez l'offre d'emploi pour laquelle vous souhaitez postuler
3. L'application analysera automatiquement la correspondance entre votre profil et l'offre
4. Générez un CV optimisé qui met en valeur vos compétences pertinentes
5. Créez une lettre de motivation personnalisée dans le style de votre choix
6. Exportez les documents finalisés au format PDF

## Développement

### Structure du projet

Le projet suit une architecture modulaire avec une séparation claire des responsabilités :
- `components/` : Composants React organisés par fonctionnalité
- `lib/` : Utilitaires et fonctions partagées
- `pages/` : Pages Next.js et API routes
- `store/` : Gestion d'état global avec Zustand
- `types/` : Types TypeScript pour le typage strict
- `styles/` : Styles globaux et configuration Tailwind

### Tests

Exécuter les tests unitaires :
```bash
npm test
```

Exécuter les tests en mode watch :
```bash
npm run test:watch
```