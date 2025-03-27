# Vocatio - Optimiseur de CV par IA

![Logo Vocatio](public/vocatio-logo.png)

## 📋 À propos

Vocatio est une application web qui utilise l'intelligence artificielle pour optimiser votre CV en fonction d'offres d'emploi spécifiques. L'application analyse votre CV existant et l'offre d'emploi, puis reformule et réorganise stratégiquement votre contenu sans jamais inventer d'informations.

**Caractéristiques principales :**
- Analyse de CV (PDF/DOCX) par IA
- Extraction des exigences d'offres d'emploi
- Optimisation éthique du contenu (sans invention de données)
- Templates de CV professionnels via l'API Canva
- Personnalisation et export en PDF haute qualité
- 100% sans état - aucune donnée n'est stockée de façon permanente

## 🛠️ Technologies

- **Frontend :** React 18, Next.js 13+ (App Router), TypeScript
- **Styles :** Tailwind CSS
- **Gestion d'état :** Zustand
- **Intelligence artificielle :** API Anthropic Claude
- **Manipulation de documents :** pdf-lib, mammoth, jsPDF
- **Templates :** API Canva

## 🚀 Démarrage rapide

### Prérequis

- Node.js (v18 ou plus récent)
- Compte [Anthropic](https://console.anthropic.com/) pour accéder à l'API Claude
- Compte [Canva Developer](https://developer.canva.com/) pour les templates

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/your-username/vocatio.git
cd vocatio

# Installer les dépendances
npm install

# Configurer les variables d'environnement
# Créer un fichier .env.local à la racine avec le contenu suivant :
# ANTHROPIC_API_KEY=votre_clé_api
# CANVA_CLIENT_ID=votre_client_id
# CANVA_CLIENT_SECRET=votre_client_secret
# NEXT_PUBLIC_MAX_FILE_SIZE=10485760

# Lancer le serveur de développement
npm run dev
```

L'application sera accessible à l'adresse [http://localhost:3000](http://localhost:3000).

## 📁 Structure du projet

```
vocatio/
├── public/              # Ressources statiques
├── src/
│   ├── app/             # Pages Next.js (App Router)
│   │   ├── api/         # Routes API
│   │   └── ...          # Routes de l'application 
│   ├── components/      # Composants React
│   │   ├── cv-upload/   # Import de CV
│   │   ├── job-upload/  # Analyse d'offre d'emploi
│   │   ├── optimize/    # Optimisation du CV
│   │   ├── preview/     # Prévisualisation du CV
│   │   ├── template-selector/ # Sélection de templates
│   │   ├── ui/          # Composants d'interface réutilisables
│   │   └── layout/      # Composants de mise en page
│   ├── services/        # Services et intégrations d'API
│   │   ├── ai/          # Intégration Anthropic Claude
│   │   ├── templates/   # Intégration Canva
│   │   └── integrity/   # Vérification d'intégrité des données
│   └── store/           # Gestion d'état global (Zustand)
└── ...
```

## 💡 Points d'attention importants

### Directive 'use client'

Ce projet utilise Next.js App Router, qui considère tous les composants par défaut comme des composants serveur. Tous les composants utilisant des hooks React ou des fonctionnalités spécifiques au client doivent commencer par la directive `'use client';` en première ligne.

### Éthique d'optimisation

Vocatio est conçu pour respecter l'intégrité des données. L'application ne doit JAMAIS inventer de compétences, expériences ou qualifications. Elle se limite à reformuler et réorganiser le contenu existant pour le mettre en valeur.

## 🔑 APIs et intégrations

### API Anthropic Claude

Utilisée pour analyser les CV, extraire les informations pertinentes des offres d'emploi et optimiser le contenu de manière intelligente.

### API Canva

Fournit des templates professionnels pour les CV et permet de générer des documents PDF de haute qualité.

## 🚢 Déploiement

### Sur Vercel (recommandé)

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter à Vercel
vercel login

# Déployer
vercel
```

N'oubliez pas de configurer les variables d'environnement dans le dashboard Vercel.

## 👥 Contribution

Les contributions sont bienvenues ! N'hésitez pas à ouvrir une issue ou soumettre une pull request.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

---

Créé avec ❤️ 