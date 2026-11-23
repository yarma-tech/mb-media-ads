# Audit du tableau de création - 29 octobre 2026

Périmètre : interactions du tableau, barre d’outils, aperçu et détails. Vérifications Playwright sur un build connecté local avec API simulée ; aucune donnée utilisateur modifiée par ces tests.

## Problèmes reproduits puis corrigés

- **Pause sans saisie** : une minuterie locale relâchait le verrou après 90 secondes, puis affichait « Reprendre l’édition » comme s’il s’agissait d’un conflit. Reproduit sur viewport mobile en avançant l’horloge de deux minutes. Le bail est désormais renouvelé tant que l’éditeur est ouvert. Le serveur conserve l’expiration des baux des onglets fermés ou suspendus.
- **Reprise mobile** : avant une sauvegarde après suspension, le même bail est repris. Un autre éditeur bloque réellement l’écriture ; une révision distante différente exige une reprise volontaire. Dans les deux cas, la saisie locale reste conservée.
- **Batch Google** : « Titres » était visuellement sélectionné, mais l’état interne ciblait `copy`. Reproduit en inspectant la commande. Le champ initial est désormais `headlines` ; changer de canal réinitialise le formulaire batch.
- **Actions sans effet visible** : le batch s’ouvre même sans sélection avec une indication ; les envois incomplets expliquent les champs manquants ; l’ajout fait apparaître les formats ; l’aperçu est amené à l’écran sur mobile.
- **Déverrouillage** : une annonce approuvée peut être déverrouillée directement, sans sélectionner sa ligne au préalable. Confirmation maintenue.
- **Déplacement tactile** : toucher la poignée ouvre « Monter / Descendre ». Le glisser-déposer et Alt + flèches restent disponibles.
- **Notification mobile** : correction du bouton de fermeture comprimé, avec une cible tactile de 44 pixels et une croix contrastée.

## Inventaire des actions

| Contrôle | Action et garde-fous | Vérification |
| --- | --- | --- |
| Onglets de canal | Change le tableau, réinitialise sélection et batch, onglet actif visible | E2E contexte/canaux/rechargement/mobile |
| Copier tout | Copie chaque annonce en bloc texte, y compris brouillon actif ; erreur explicite si presse-papiers indisponible | E2E « Copier tout produit des blocs texte complets » |
| Appliquer un champ | Ouvre le formulaire ; indique qu’il faut sélectionner des lignes ; confirmation avant remplacement | E2E batch Google et outils mobile ; traitement de sélection inspecté |
| Champ / valeur / Appliquer | Champ conforme au canal ; tableaux de titres/descriptions Google ; formulaire conservé en cas d’échec | E2E batch Google et outils mobile |
| Ajouter des annonces | Ouvre les formats et les amène à l’écran ; indisponible pour campagne terminée | E2E outils mobile et création sans doublon |
| Formats / Confirmer | Crée les formats sélectionnés ; garde sélection en cas d’échec ; bloque doubles commandes | E2E formats et duplication sous latence |
| Ajouter des médias | Ouvre l’étape de dépôt pour les canaux choisis | E2E configuration trois étapes/dépôt multiple |
| Aperçu global ou par ligne | Ouvre l’annonce choisie ; défilement vers aperçu mobile ; message si aucune annonce | E2E outils mobile et détails/médias |
| Sélection globale / ligne | Sélectionne le canal courant ou une ligne ; contexte isolé par campagne | E2E contexte historique, batch et outils mobile |
| Poignée de ligne | Glisser-déposer, Alt + flèches, ou menu tactile Monter/Descendre ; limites désactivées | E2E déplacement clavier persistant et tactile |
| Format | Choix limité au catalogue ; sauvegarde et conformité recalculées | E2E format/détails/média |
| Cellules texte | Saisie puis sauvegarde ; Tab traverse les lignes ; brouillons conservés en cas d’échec | E2E Tab, réseau, pause et conflits |
| Cadenas | Confirmation volontaire ; déverrouille la bonne annonce ; modification retire approbation | E2E déverrouillage direct d’une autre ligne |
| Envoyer la ligne | Sauvegarde préalable puis soumission ; explique les champs manquants ou le statut protégé | E2E soumission unique et envoi incomplet mobile |
| Envoyer sélection / annonces prêtes | Même chemin de sauvegarde et soumission ; sélection explicite ou ensemble prêt ; campagne terminée et envoi en cours protégés | Branchement des deux boutons inspecté ; chemin partagé couvert par E2E soumission |
| Dupliquer | Crée une copie brouillon sous la source ; bloque doublon pendant requête | E2E duplication sous latence et persistante |
| Nouvelle version | Crée une version modifiable d’une annonce On air/arrêtée ; original conservé | E2E nouvelle version protégée sous latence |
| Commentaire traité | Marque le commentaire pris en compte, conserve contenu grisé ; pas d’approbation implicite | E2E commentaire traité |
| Reprendre / Réessayer | Réacquiert bail et conserve patch local ; seulement pour erreur/conflit réel | E2E conflit concurrent et révision distante |
| Fermer aperçu / précédent / suivant | Ferme ou change annonce ; extrémités désactivées | E2E outils mobile et navigation aperçu |
| Détails / Historique | Déplie les champs secondaires et événements de l’annonce active | E2E format/détails/média/historique |
| Nom / média associé / joindre un média | Sauvegarde sur annonce active ; association compatible uniquement ; dépôt puis vérification | E2E détails/média de ligne et upload |
| Fermer notification | Ferme le message, cible tactile 44 pixels | Interaction E2E mobile ; contrôle visuel |

Les boutons désactivés pendant une requête, aux limites du pager/déplacement ou sur une campagne terminée restent intentionnels. Les prérequis manquants donnent désormais un retour visible plutôt qu’un bouton muet.
