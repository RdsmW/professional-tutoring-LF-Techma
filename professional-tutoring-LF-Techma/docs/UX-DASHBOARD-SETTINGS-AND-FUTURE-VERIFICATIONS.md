# Vérifications UX Dashboard, Settings et futures vérifications

**Statut :** plan de vérification à exécuter avant toute nouvelle modification UX  
**Périmètre :** Staff Dashboard, Staff Settings, disponibilité des tuteurs,
affectation des demandes et méthode de vérification réutilisable

## Règle de non-duplication

Le rapport Stripe/Phase 1/Phase 2 déjà réalisé reste dans :

- `docs/CURRENT-IMPLEMENTATION-VERIFICATION.md`

Ce fichier ne reprend pas ce rapport. Il couvre uniquement les vérifications
UX et d’affectation qui n’avaient pas encore leur propre fichier `.md`.

## 1. Vérification précédente — Staff Dashboard

Inspecter le code actuel, la route `/staff`, les composants rendus et l’UI
réelle. Ne pas déduire le résultat de la demande initiale : documenter ce qui
existe réellement.

### Capacity

- Le premier écran doit afficher un panneau intitulé exactement **`This Week Capacity`**.
- Ne pas utiliser `18 Capacity` comme titre ou libellé.
- Le panneau doit être visible au premier écran desktop et occuper environ
  la moitié de la largeur avec Priority Queue.
- Vérifier les valeurs, les libellés, les états vides et les états de
  chargement.

### Priority Queue

- Elle doit être visible au premier écran, en proportion approximative 50/50
  avec Capacity sur desktop.
- Le titre doit afficher le total après le nom, par exemple `Priority Queue 20`.
- Elle doit être une seule liste compacte, sans séparation en colonnes.
- Chaque ligne doit afficher son statut devant l’élément :
  - `New assignment` dans un chip jaune ;
  - `Payment issue` dans un chip rouge.
- Afficher au maximum trois éléments combinés, sans scroll dans le panneau.
- Supprimer les boutons `View all`.
- Conserver uniquement `Open queue`.
- Vérifier que `Open queue` mène à une page dédiée affichant tous les éléments
  avec les filtres :
  - `All` ;
  - `New assignments` ;
  - `Payment issues`.

### Recently added students

- Afficher au maximum trois étudiants sur le Dashboard.
- Vérifier que `Open students` mène à la liste complète.
- Vérifier que l’absence de données ne crée pas un espace vide artificiel.

### Héros et hauteur

- Restaurer le contenu du héros avec la date, `Welcome` et le nom affiché en
  blanc.
- Supprimer l’espace vide artificiel en bas.
- Vérifier une hauteur fluide et naturelle sur desktop et viewport étroit.

### Résultat attendu du rapport Dashboard

Documenter :

- **Already correct**
- **Incorrect**
- **Not verified**
- **Smallest changes required**
- routes et fichiers exacts ;
- résultat runtime ;
- captures ou observations responsive si disponibles ;
- régressions constatées.

## 2. Vérification précédente — Settings > Courses / Subjects

Inspecter la page Settings et les composants réels, sans implémenter de
correction pendant la vérification.

- Les tables doivent être la vue principale.
- Chaque table doit avoir son propre bouton `+` en haut à droite.
- Le survol doit afficher exactement :
  - `New Subject` ;
  - `New course`.
- Les formulaires doivent rester dans des modals.
- Le même modal doit servir à la création et à l’édition.
- En mode édition, les valeurs existantes doivent être préremplies.
- Vérifier :
  - validation ;
  - état de chargement ;
  - succès ;
  - erreur ;
  - fermeture par bouton ;
  - fermeture par `Échap` ;
  - fermeture par clic extérieur ;
  - toast visible et lisible.
- Vérifier les appels API, les permissions staff et les états vides.

### Résultat attendu

Documenter les routes Settings, les composants concernés, les comportements
réels et la plus petite correction nécessaire. Ne pas modifier les formulaires
pendant cette étape.

## 3. Vérification précédente — Settings > Public Forms

Inspecter la page et le composant Public Forms réellement utilisés.

- Remplacer les actions visibles par un menu `⋮`.
- Le menu doit contenir exactement, dans cet ordre :
  1. `Open`
  2. `Copy link`
  3. `Share`
  4. `Embed`
  5. `Edit`
- Vérifier que `Embed` ouvre un modal accessible contenant le code.
- Vérifier l’action `Copy`.
- Vérifier une confirmation visuelle après copie ou partage.
- Vérifier la fermeture par bouton, `Échap` et clic extérieur.
- Vérifier que le tableau évite l’espace vide entre `Public link` et l’icône.
- Vérifier que l’icône possède un padding droit équilibré.
- Vérifier que `Edit` correspond bien à l’état actuel de l’éditeur :
  - éditeur complet existant ;
  - action informative uniquement ;
  - ou comportement manquant.
- Ne pas déclarer un éditeur versionné comme existant sans vérifier les
  brouillons, la publication explicite, les versions immuables et le rollback.

## 4. Vérification précédente — Notifications

- Vérifier que les toasts sont visibles, lisibles et non masqués par le layout.
- Vérifier les états succès, erreur, chargement et information.
- Vérifier autant que possible l’utilisation du composant partagé :
  `src/components/app-toast.tsx`.
- Rechercher les notifications inline concurrentes et les classer :
  - à conserver pour une erreur de formulaire contextuelle ;
  - à migrer vers le toast partagé ;
  - à documenter comme exception justifiée.
- Vérifier la durée d’affichage, la fermeture manuelle, l’accessibilité et le
  comportement sur viewport mobile.

## 5. Nouvelle vérification — Tutor Availability and Assignment UX

Cette section reprend la vérification du fichier joint
`Pasted-Verification-task-only-do-not-modify-code-yet-We-need-t_1787216312298.txt`.
Elle est indépendante du rapport Stripe existant.

### 5.1 Parent Path A — disponibilité des tuteurs

Après sélection par le parent de la matière principale et de la fenêtre ou du
créneau préféré, vérifier exactement quels tuteurs sont affichés.

Un tuteur ne doit être affiché que si toutes les conditions suivantes sont
effectivement appliquées par le code actuel :

- tuteur actif ;
- matière principale enseignée par le tuteur ;
- créneau actif correspondant à la fenêtre choisie ;
- capacité restante :
  `booked_seats + held_seats < capacity_seats`.

Identifier les fichiers, fonctions et requêtes API qui appliquent chaque
condition.

Vérifier avec le code et, si possible, des données contrôlées qu’un tuteur
avec les caractéristiques suivantes ne peut pas apparaître au parent :

- aucune matière correspondante ;
- aucune disponibilité dans la fenêtre sélectionnée ;
- disponibilité inactive ;
- créneau complet.

### 5.2 Path A — comportement final

Vérifier le chemin réel :

`sélection parent → paiement/setup requis → revalidation serveur → même tutoring request → une réservation → exactement un siège → confirmé`

Vérifier explicitement :

- aucune entrée inutile dans une file d’affectation staff ;
- aucun clic staff `Assign` requis pour un choix Path A valide ;
- création automatique de la réservation finale ;
- revalidation du tuteur actif ;
- vérification que le tuteur enseigne la matière de la demande ;
- vérification que le créneau appartient au tuteur ;
- vérification que le créneau correspond à la fenêtre demandée ;
- vérification que le créneau est actif ;
- vérification de la capacité restante ;
- tout contrôle manquant, même si le flux fonctionne autrement.

### 5.3 Path B — choix par Staff

Inspecter la page d’affectation réellement utilisée pour
`Let Professional Tutoring choose`.

Vérifier si Staff voit immédiatement :

- étudiant ;
- famille ;
- matière principale ;
- fenêtres ou horaires préférés du parent ;
- uniquement les tuteurs qui enseignent la matière ;
- uniquement les créneaux pertinents ;
- capacité restante de chaque option.

Documenter ce qui est actuellement affiché et ce qui manque. Staff ne devrait
pas devoir ouvrir plusieurs profils de tuteurs pour comparer manuellement les
disponibilités.

### 5.4 Navigation et modules Staff

Lister exactement les éléments visibles dans la navigation/sidebar actuelle et
indiquer le rôle de chaque page :

- Staff Home/Dashboard ;
- tutoring requests, si présent ;
- Tutors ;
- Sessions ;
- Requests ;
- Reports/Waitlist ;
- tout module ou page Scheduling.

Recommander le plus petit emplacement intuitif pour les affectations :

- Dashboard : travail nécessitant une attention ;
- page d’affectation dédiée : exécution du travail ;
- Reports : reporting, pas workflow quotidien ;
- Sessions : tutorat déjà réservé ;
- Tutors : gestion des tuteurs et disponibilités ;
- Requests : demandes entrantes, si cette page existe déjà.

Ne pas proposer un nouveau module si une page existante convient.

### Résultat attendu — disponibilité et affectation

Le rapport doit contenir :

- **Already correct**
- **Incorrect**
- **Not verified**
- **Smallest changes required**
- routes UI actuelles ;
- fichiers et fonctions exacts ;
- requêtes ou endpoints concernés ;
- résultats avec données contrôlées ;
- tout contrôle de sécurité ou de capacité manquant.

## 6. Instruction exacte pour lancer l’implémentation Dashboard/Settings

Pour commencer les modifications après la vérification, utiliser cette
instruction :

> Lance maintenant l’implémentation des corrections Dashboard et Settings
> décrites dans `docs/UX-DASHBOARD-SETTINGS-AND-FUTURE-VERIFICATIONS.md`.
> Utilise les résultats de vérification disponibles, sans modifier les règles
> serveur de paiement, booking, pricing, scheduling ou matching. Commence par
> le Staff Dashboard, puis Settings > Courses/Subjects, puis Settings > Public
> Forms et les notifications. Le titre exact du panneau est **This Week
> Capacity**, jamais `18 Capacity`. Conserve les formulaires en modals,
> utilise les toasts partagés, respecte les routes et composants existants,
> puis vérifie chaque comportement avec TypeScript, lint, tests et runtime.
> N’ajoute pas de nouveau module si la navigation actuelle peut accueillir la
> fonctionnalité.

Avant de lancer cette instruction, la vérification de la section concernée
doit être terminée ou explicitement marquée `Not verified`.

## 7. Modèle pour toute future vérification

Créer un nouveau fichier `.md` uniquement si la vérification n’est pas déjà
documentée dans un rapport existant. Ne pas recopier le contenu d’un autre
rapport.

Utiliser cette structure :

```md
# [Nom précis de la vérification]

**Date :**
**Scope :**
**Instruction source :**

## Méthode et limites

- Code inspecté :
- Routes/UI inspectées :
- Données contrôlées utilisées :
- Tests exécutés :
- Ce qui n’a pas été modifié :

## Already correct

- Résultat :
- Fichiers/routes :
- Preuve runtime :

## Incorrect

- Résultat :
- Fichiers/routes :
- Risque :

## Not verified

- Élément :
- Pourquoi :
- Prérequis minimal :

## Smallest changes required

- Correction minimale :
- Fichiers probables :
- Hors périmètre :

## Vérifications exécutées

| Check | Result | Evidence |
| --- | --- | --- |
| TypeScript | | |
| Lint | | |
| Tests | | |
| Runtime/UI | | |

## Verified working

## Verified broken

## Still unverified

## Minimum next implementation work
```

### Règles pour les futures vérifications

- Vérification uniquement si l’instruction le demande ; ne pas corriger
  automatiquement les problèmes découverts.
- Inspecter le code et le runtime actuels, pas seulement le plan prévu.
- Signaler séparément `Already correct`, `Incorrect` et `Not verified`.
- Indiquer les routes, fichiers, fonctions et preuves exacts.
- Ne pas refaire un rapport déjà présent.
- Ne pas modifier le comportement métier pour faciliter un test.
- Terminer le rapport par les quatre sections :
  `Verified working`, `Verified broken`, `Still unverified`,
  `Minimum next implementation work`.