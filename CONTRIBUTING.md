// CONTRIBUTING.md
# Guide de contribution à Vocatio

Merci de l'intérêt que vous portez à la contribution au projet Vocatio ! Voici quelques directives pour vous aider à contribuer efficacement.

## Processus de contribution

1. **Fork** le dépôt sur GitHub
2. **Clonez** votre fork sur votre machine locale
3. Créez une nouvelle **branche** pour vos modifications
4. Apportez vos **modifications**
5. Exécutez les **tests** pour vous assurer que tout fonctionne
6. **Commit** vos changements avec des messages clairs
7. **Push** vos modifications vers votre fork
8. Soumettez une **Pull Request** au dépôt principal

## Conventions de code

- Suivez les règles ESLint configurées dans le projet
- Utilisez TypeScript avec des types explicites
- Suivez l'architecture et l'organisation des fichiers existante
- Utilisez les composants et hooks existants lorsque possible
- Documentez votre code avec des commentaires clairs

## Tests

Tous les nouveaux changements doivent être couverts par des tests. Exécutez les tests avant de soumettre une PR:

```bash
npm test
```

## Rapports de bugs et demandes de fonctionnalités

- Utilisez les "Issues" GitHub pour signaler des bugs ou proposer de nouvelles fonctionnalités
- Vérifiez d'abord si le problème a déjà été signalé
- Fournissez autant d'informations que possible: étapes pour reproduire, contexte, captures d'écran, etc.

## Style de commit

Nous suivons un format de message de commit conventionnel:

- `feat:` pour les nouvelles fonctionnalités
- `fix:` pour les corrections de bugs
- `docs:` pour les changements de documentation
- `style:` pour les changements de formatage
- `refactor:` pour les modifications de code qui n'ajoutent pas de fonctionnalités ou ne corrigent pas de bugs
- `test:` pour ajouter des tests manquants
- `chore:` pour les tâches de maintenance

Exemple: `feat: ajouter la génération de CV en plusieurs langues`

## Construire et déployer

Pour lancer l'application en local:

```bash
npm install
npm run dev
```

## Questions?

Si vous avez des questions sur le processus de contribution, n'hésitez pas à ouvrir une Issue pour demander de l'aide.

Merci de contribuer à rendre Vocatio meilleur pour tous !