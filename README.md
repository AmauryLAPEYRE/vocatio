# Vocatio 2.0

Vocatio 2.0 est une application d'optimisation de CV avec IA avancée qui transforme de manière transparente un CV existant pour correspondre à n'importe quelle offre d'emploi, tout en conservant fidèlement sa mise en forme visuelle (design, couleurs, polices, structure, etc.).

## 🌟 Caractéristiques principales

- **Analyse documentaire avancée avec LayoutLM**: Comprend la structure spatiale et visuelle des documents sans balisage
- **Préservation parfaite de la mise en forme**: Reproduction fidèle pixel-perfect de n'importe quel CV
- **Adaptation intelligente du contenu**: Optimisation contextuelle avec respect des contraintes spatiales
- **Comparaison visuelle et métriques**: Visualisation côte à côte et mise en évidence des modifications
- **Export haute-fidélité**: Génération PDF avec fidélité visuelle garantie

## 🛠️ Stack technique

- **Frontend**: React 18, Next.js 14, Tailwind CSS
- **Gestion d'état**: Zustand
- **Requêtes et cache**: React Query
- **Intelligence documentaire**: LayoutLM (quantifié pour Edge Functions)
- **Analyse PDF**: PDF.js
- **Edge Functions ML**: Vercel Edge Functions, ONNX Runtime
- **IA/NLP**: API Anthropic Claude
- **Exportation et rendu**: html2canvas, jsPDF

## 📋 Prérequis

- Node.js 18+ et npm
- Python 3.8+ (pour la quantification du modèle LayoutLM)
- Compte Vercel (pour le déploiement)
- Clé API Anthropic Claude

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone <url-du-dépôt>
cd vocatio-2.0
```

### 2. Installer les dépendances JavaScript

```bash
npm install
```

### 3. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```
ANTHROPIC_API_KEY=votre_clé_api_anthropic
```

### 4. Préparation du modèle LayoutLM

Pour le développement et la production, nous avons besoin de quantifier le modèle LayoutLM :

```bash
# Créer et activer un environnement Python dédié
python -m venv vocatio-ml-env
vocatio-ml-env\Scripts\activate  # Windows
source vocatio-ml-env/bin/activate  # macOS/Linux

# Installer les dépendances nécessaires
pip install torch==2.0.1
pip install tf-keras
pip install transformers==4.30.2
pip install onnx==1.14.0 onnxruntime==1.15.1
pip install optimum==1.12.0

# Quantifier le modèle
python scripts/quantize_layoutlm.py --input_model microsoft/layoutlm-base-uncased --output_model ./public/models/layoutlm-quantized.onnx --quantize int8
```

### 5. Lancer l'application en développement

```bash
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## 📦 Déploiement

### Déploiement sur Vercel

```bash
# Installation de Vercel CLI
npm i -g vercel

# Déploiement
vercel
```

Assurez-vous de configurer les variables d'environnement sur Vercel :

- `ANTHROPIC_API_KEY`: Votre clé API Anthropic Claude

## 📁 Structure du projet

```
vocatio-2.0/
├── app/                      # Application Next.js
│   ├── api/                  # Routes API Edge Functions
│   │   ├── document-analysis/
│   │   ├── optimize-content/
│   │   └── export-document/
│   ├── layout.js             # Layout principal
│   ├── globals.css           # Styles globaux
│   └── page.js               # Page principale
├── components/               # Composants React
│   ├── DocumentComparison.jsx
│   ├── DocumentPreview.jsx
│   ├── ExportOptions.jsx
│   ├── FileUploadZone.jsx
│   ├── Header.jsx
│   ├── JobDescriptionInput.jsx
│   ├── LoadingIndicator.jsx
│   └── OptimizationMetrics.jsx
├── lib/                      # Logique métier
│   ├── layoutlm/             # Intégration LayoutLM
│   ├── document/             # Traitement de document
│   ├── content/              # Optimisation de contenu
│   └── export/               # Export PDF
├── public/                   # Fichiers statiques
│   └── models/               # Modèles ML
│       └── layoutlm-quantized.onnx
├── scripts/                  # Scripts utilitaires
│   └── quantize_layoutlm.py  # Script de quantification
├── store/                    # Gestion d'état Zustand
│   └── index.js
├── next.config.js            # Configuration Next.js
├── package.json              # Dépendances
├── tailwind.config.js        # Configuration Tailwind
└── vercel.json               # Configuration Vercel
```

## 🔄 Flux d'utilisation

1. **Upload du CV**: L'utilisateur télécharge son CV au format PDF/DOCX
2. **Analyse documentaire**: LayoutLM analyse la structure et la mise en page du document
3. **Saisie de l'offre d'emploi**: L'utilisateur saisit le texte de l'offre d'emploi cible
4. **Optimisation du contenu**: Claude API adapte le contenu pour mieux correspondre à l'offre
5. **Comparaison et prévisualisation**: Visualisation côte à côte des versions originale et optimisée
6. **Export**: Téléchargement du CV optimisé au format PDF

## 🧪 Dépannage

### Problèmes courants

- **Erreur de quantification LayoutLM**: Vérifiez que vous avez bien installé tf-keras et les versions correctes des dépendances
- **Erreur "Module not found"**: Assurez-vous d'avoir exécuté `npm install`
- **Erreur d'API Claude**: Vérifiez votre clé API dans le fichier `.env.local`
- **Problèmes avec Vercel Edge Functions**: Assurez-vous que le modèle quantifié ne dépasse pas 50MB

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.

---

Développé avec ❤️ pour aider les candidats à se démarquer dans leur recherche d'emploi.