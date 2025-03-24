Vocatio - Optimisation de CV et Génération de Lettres de Motivation
Vocatio est une application frontend avancée qui permet aux utilisateurs d'optimiser leur CV et de générer des lettres de motivation personnalisées, en préservant parfaitement la mise en forme originale du CV. L'application utilise l'IA d'Anthropic Claude pour l'analyse et la génération de contenu, offrant une expérience sans friction et des résultats de haute qualité.
Afficher l'image
Fonctionnalités Principales
📄 Préservation parfaite du format des CV

Import de CV existants (PDF, DOCX)
Analyse précise et reconstruction fidèle du format visuel (polices, couleurs, mise en page)
Optimisation du contenu textuel sans altérer le design et la structure
HTML/CSS généré proprement pour une représentation parfaite

💼 Analyse intelligente des offres d'emploi

Import et analyse des offres d'emploi
Extraction automatique des compétences requises et mots-clés
Détection des exigences et responsabilités principales
Suggestion d'adaptations pertinentes pour votre candidature

🔍 Analyse de correspondance avancée

Évaluation du degré de compatibilité entre votre profil et le poste
Identification des points forts à mettre en avant
Détection des compétences manquantes ou à renforcer
Recommandations personnalisées pour augmenter vos chances

✏️ Génération de lettres de motivation

Création de lettres adaptées à chaque offre spécifique
Styles d'écriture variés (formel, créatif, technique, etc.)
Options de personnalisation avancées (ton, longueur, structure)
Mise en valeur intelligente de vos expériences pertinentes

📊 Exportation haute qualité

Export PDF fidèle au design original
Options d'impression optimisées
Conservation de toutes les polices et éléments visuels

Architecture Technique
Vocatio est développé avec les technologies modernes suivantes :
Frontend

Framework: React 18 + Next.js 14
Styles: Tailwind CSS
Gestion d'état: Zustand
UI/UX: Composants accessibles et responsive

Traitement de Documents

Analyse PDF: PDF.js avec extraction avancée de mise en forme
Traitement DOCX: Mammoth.js avec préservation de structure
Rendu HTML/CSS: Système personnalisé de recréation fidèle
Export PDF: html2canvas + jsPDF optimisés

IA/NLP

Modèle: Anthropic Claude via API
Infrastructure: Vercel Edge Functions
Prompting: Techniques d'ingénierie de prompt avancées

Performance et Sécurité

Optimisations: Chargement asynchrone, mise en cache, lazy loading
Sécurité: Validation des fichiers, sanitisation HTML, protection CSRF
Accessibilité: Conformité WCAG AA, navigation au clavier, support lecteurs d'écran

Structure du Projet
Copiersrc/
├── components/          # Composants React organisés par fonctionnalité
│   ├── common/          # Composants UI communs (optimisés et accessibles)
│   ├── cv/              # Composants liés aux CV (avec préservation de format)
│   ├── job/             # Composants liés aux offres d'emploi
│   ├── letter/          # Composants liés aux lettres de motivation
│   ├── matcher/         # Composants d'analyse d'adéquation
│   └── export/          # Composants liés à l'exportation
├── hooks/               # Hooks personnalisés centralisés
│   ├── useOptimization.tsx
│   ├── useLetterGeneration.tsx
│   └── useError.tsx
├── lib/
│   ├── accessibility/   # Outils d'accessibilité
│   ├── api/             # Intégrations API (Claude)
│   ├── document-processing/ # Traitement avancé de documents
│   ├── error/           # Gestion centralisée des erreurs
│   ├── performance/     # Optimisations de performance
│   └── security/        # Outils de sécurité
├── pages/               # Pages Next.js et API routes
├── store/               # Gestion d'état Zustand
└── styles/              # Styles CSS
Installation et Déploiement
Prérequis

Node.js 18+ et npm
Compte Vercel
Clé API Anthropic Claude

Installation locale

Cloner le dépôt
bashCopiergit clone https://github.com/votre-compte/vocatio.git
cd vocatio

Installer les dépendances
bashCopiernpm install

Configurer les variables d'environnement

Créer un fichier .env.local à la racine du projet
Ajouter votre clé API Anthropic: ANTHROPIC_API_KEY=votre_clé_api


Démarrer le serveur de développement
bashCopiernpm run dev

L'application sera disponible à l'adresse http://localhost:3000

Déploiement sur Vercel

Connectez votre dépôt GitHub à Vercel
Configurez la variable d'environnement ANTHROPIC_API_KEY dans les paramètres du projet
Déployez l'application

Optimisations et Performances
Vocatio intègre de nombreuses optimisations pour garantir une expérience rapide et fluide :

Préchargement intelligent des ressources critiques
Mise en cache des traitements lourds pour éviter les répétitions
Lazy loading des composants et images non critiques
Traitement par lots pour les opérations intensives
Compression et optimisation des ressources statiques

Sécurité et Confidentialité
La sécurité et la confidentialité des données sont des priorités absolues :

Traitement 100% côté client - Aucune donnée sensible n'est stockée sur nos serveurs
Validation de fichiers - Vérification complète des fichiers téléchargés
Sanitisation HTML - Protection contre les injections XSS
En-têtes de sécurité - Protection contre diverses vulnérabilités web
Accès API sécurisé - Communication sécurisée avec l'API Claude

Accessibilité
Vocatio est conçu pour être accessible à tous les utilisateurs :

Navigation au clavier complète
Compatibilité avec les lecteurs d'écran
Contraste de couleurs conforme aux normes WCAG AA
Textes alternatifs pour tous les éléments visuels
Messages d'erreur explicites et instructions claires

Tests
Exécuter les tests unitaires et d'intégration :
bashCopiernpm test
Exécuter les tests en mode watch :
bashCopiernpm run test:watch
Contribution
Consultez le fichier CONTRIBUTING.md pour les directives de contribution.
Licence
Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.