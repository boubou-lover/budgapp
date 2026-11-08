# Mon Budget — version hébergée + Supabase (partage familial)

## Contenu
- `index.html`, `style.css`, `app.js` : l'application (même code que la version claude.ai)
- `backend.js` : connexion à Supabase (écran de connexion, base partagée en temps réel)
- `config.js` : **à remplir** (adresse et clé de ton projet Supabase)
- `setup.sql` : création de la table et des règles de sécurité
- `vendor/` : bibliothèques embarquées (supabase-js 2.118.0, SheetJS 0.18.5) — aucun script externe

## Mise en place (≈ 20 min)
1. Crée un compte sur supabase.com, puis un projet **gratuit** en choisissant une **région européenne** (Francfort ou Paris).
2. **SQL Editor** → colle le contenu de `setup.sql` → *Run*.
3. **Authentication → Sign In / Providers** : décoche **« Allow new users to sign up »** (très important : seuls les comptes que tu crées auront accès).
4. **Authentication → Users → Add user → Create new user** : un compte par membre de la famille (e-mail + mot de passe, coche « Auto Confirm User »).
5. **Project Settings → API** : copie *Project URL* et la clé *anon public* dans `config.js`.
6. Mets tout le dossier sur ton hébergement en **HTTPS** (ou teste en local : `python3 -m http.server 8000`).
7. Ouvre la page, connecte-toi. Pour reprendre tes données de la version claude.ai :
   Réglages → *Exporter la sauvegarde* (ancienne version), puis Réglages → *Restaurer* (nouvelle version).

## Sécurité — à savoir
- La clé *anon* est publique par conception ; la protection vient des règles de `setup.sql` : seules les personnes connectées lisent/écrivent.
  Comme les inscriptions sont fermées, « connecté » = les comptes que tu as créés.
- Les données sont **chiffrées en transit et au repos** chez Supabase, mais **pas de bout en bout** : Supabase (l'hébergeur) peut techniquement y accéder.
- Active l'authentification à deux facteurs sur ton compte Supabase et choisis des mots de passe longs.
- Tout le monde voit tout, et tout membre peut modifier ou supprimer des opérations.
- Le code de verrouillage (Réglages) protège seulement l'ouverture de la page sur l'appareil.
- Ne charge que tes propres fichiers Excel (SheetJS 0.18.5 a des failles connues avec des fichiers piégés).

## Limites
- Offre gratuite : un projet inactif pendant ~1 semaine peut être mis en pause (réactivation en un clic) et il n'y a pas de sauvegarde automatique → exporte une sauvegarde chaque mois.
- Modifications simultanées du même mois : la dernière écriture gagne.
- Hors connexion, les données restent sur l'appareil et se resynchronisent à la reconnexion (le premier appareil qui écrit gagne).

## Logo et icône d'écran d'accueil
- `logo.png` / `logo-256.png` : logo nettoyé (coins arrondis transparents) ; `icon-*.png`, `apple-touch-icon.png`, `favicon-*.png` : icônes générées depuis le logo ; `manifest.webmanifest` : nom et icônes de l'app.
- Sur iPhone : Safari → Partager → « Sur l'écran d'accueil ». Sur Android (Chrome) : menu ⋮ → « Ajouter à l'écran d'accueil ».

## Mise en cache et hors connexion (`sw.js`)
- Après la première visite, l'app s'ouvre **sans réseau** (fichiers gardés dans le navigateur).
- Les fichiers de l'app sont chargés **réseau d'abord** : quand tu remplaces des fichiers sur GitHub, la nouvelle version s'applique à l'ouverture suivante avec réseau. Les bibliothèques et images viennent du cache.
- Supabase n'est **jamais** mis en cache : les données viennent toujours du serveur.
- Hors connexion, l'app passe en mode local et garde tes saisies ; voir « Synchronisation fiable » ci-dessous.
- Pour forcer le renouvellement du cache après une grosse mise à jour : changer `V='budgapp-v1'` en `V='budgapp-v2'` dans `sw.js`.
- Le cache ne fonctionne qu'en HTTPS (GitHub Pages convient) et n'existe pas sur la version claude.ai.

## Synchronisation fiable (file d'attente)
- Chaque modification est d'abord enregistrée sur l'appareil, puis placée dans une **file d'attente** (`budget_outbox`). Elle n'en sort que lorsque **Supabase a confirmé** l'écriture.
- **Pastille dans l'en-tête** : « ⟳ 2 » = envoi en cours ; « ⚠ 2 en attente » = hors ligne ou refus du serveur. Toucher la pastille relance l'envoi.
- **Reprise automatique** : nouvel essai à chaque retour du réseau, à chaque réouverture de l'app, toutes les 30 s, et avec un délai croissant après un échec.
- **Démarrage sans réseau** : l'app s'ouvre en mode local puis se reconnecte seule.
- **Rechargement avant confirmation** : les saisies en attente ne sont jamais écrasées par l'état du serveur ; elles sont envoyées ensuite.
- **Fusion** : avant d'écrire un mois, l'app relit le serveur et conserve les ajouts faits ailleurs. Les suppressions sont propagées (« pierres tombales » gardées 90 jours) pour qu'une opération supprimée ne réapparaisse pas.
- **Limite** : si deux personnes modifient la **même opération** en même temps, la dernière écriture l'emporte.

## Sécurité des données (restauration, stockage, serveur)
- **Sauvegarde JSON** : le fichier est entièrement vérifié **avant** toute modification (taille ≤ 12 Mo, structure, dates, montants). Au moindre défaut, il est **refusé** et rien ne change.
- **Normalisation** : identifiants limités à `A-Z a-z 0-9 _ -` (sinon régénérés), catégories inconnues remplacées par « Autre », textes nettoyés et bornés, règles/budgets/récurrents/enveloppes validés un par un.
- **Pas de code dans le HTML** : les identifiants passent par des attributs `data-*` et tout texte affiché est échappé, de sorte qu'un fichier piégé ne peut plus exécuter de script.
- Les mêmes contrôles s'appliquent aux données lues dans le **stockage local** et à celles reçues de **Supabase** (un compte de la famille compromis ne peut pas injecter de code chez les autres).
- Il n'y a pas encore de politique CSP (elle demanderait de supprimer tous les gestionnaires `onclick` en ligne).
