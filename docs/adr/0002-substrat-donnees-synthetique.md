# Substrat de données synthétique pour le prototype

Le jeu de données d'entraînement (~5000 lignes) est **généré synthétiquement**, pas issu de vrais partenariats. Les modèles apprendront donc la logique du générateur, pas le marché réel. On l'assume : le prototype vise à démontrer la chaîne de bout en bout (formulaire → optimiseur → confiance → workflow simulé), pas à fournir des prédictions fiables.

## Conséquences

- Les valeurs affichées (audience, conversion, prix, campagne idéale, niveau de confiance) sont **illustratives** et ne doivent jamais être présentées au partenaire comme des garanties.
- La crédibilité des recommandations dépend entièrement des **relations encodées dans le générateur** (cible × plateforme × secteur × type de pub → audience/conversion/prix/reach). Données ajoutées au hasard ⇒ recommandations arbitraires.
- Avant toute mise en production ou décision commerciale réelle, **réentraîner sur de vraies données** de campagnes collectées via la plateforme.
