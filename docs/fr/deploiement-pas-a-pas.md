# Déployer Shy Safari sur un sous-domaine, avec connexion et synchronisation

Ce guide met Shy Safari en ligne sur un sous-domaine d'un domaine déjà géré
par Cloudflare (dans les exemples : **`safari.exemple.fr`** — remplacez
`exemple.fr` par votre domaine), avec :

- une **page de connexion** Cloudflare Access (code envoyé par e-mail, aucun
  compte à créer pour les enseignants) ;
- la **synchronisation** : chaque enseignant retrouve ses classes sur
  n'importe quel ordinateur où il se connecte.

Tout tourne chez Cloudflare (offre gratuite) : **rien n'est installé sur un
serveur à vous**. Si vous avez déjà un VPS qui héberge d'autres services, il
n'est pas touché ; seul un nouvel enregistrement DNS `safari` est ajouté au
domaine.

Durée : environ 30 minutes. Pour comprendre les choix techniques :
[ADR 0013](../adr/0013-access-via-cloudflare-access.md) (connexion) et
[ADR 0015](../adr/0015-sync-through-cloudflare.md) (synchronisation).

- [Étape 0 — Prérequis](#étape-0--prérequis)
- [Étape 1 — Connecter Wrangler à votre compte](#étape-1--connecter-wrangler-à-votre-compte)
- [Étape 2 — Créer la base de données](#étape-2--créer-la-base-de-données)
- [Étape 3 — Créer les tables](#étape-3--créer-les-tables)
- [Étape 4 — Premier déploiement](#étape-4--premier-déploiement)
- [Étape 5 — Brancher le sous-domaine](#étape-5--brancher-le-sous-domaine)
- [Étape 6 — Fermer les autres adresses](#étape-6--fermer-les-autres-adresses)
- [Étape 7 — Préparer Cloudflare Zero Trust](#étape-7--préparer-cloudflare-zero-trust)
- [Étape 8 — Créer l'application Access](#étape-8--créer-lapplication-access)
- [Étape 9 — Activer la synchronisation](#étape-9--activer-la-synchronisation)
- [Étape 10 — Vérifier](#étape-10--vérifier)
- [Mettre à jour](#mettre-à-jour)
- [Administrer](#administrer)
- [Dépannage](#dépannage)

## Étape 0 — Prérequis

1. Le domaine (`exemple.fr`) est dans votre compte Cloudflare et ses serveurs
   de noms sont ceux de Cloudflare.
2. Dans le tableau de bord : **votre domaine → DNS → Records**. Vérifiez
   qu'**aucun enregistrement `safari`** n'existe déjà (sinon choisissez un
   autre sous-domaine, ou supprimez l'ancien s'il ne sert plus).
3. Sur votre ordinateur : Git, Bun et le code, comme dans
   [lancer-en-local.md](lancer-en-local.md) (étapes 1 à 3) :

   ```sh
   git clone https://github.com/vant0m/shy-safari.git
   cd shy-safari
   bun install
   ```

Toutes les commandes suivantes se lancent dans le dossier `shy-safari`.

## Étape 1 — Connecter Wrangler à votre compte

```sh
bunx wrangler login
```

Un navigateur s'ouvre : connectez-vous à Cloudflare et autorisez Wrangler.
Vérifiez avec :

```sh
bunx wrangler whoami
```

## Étape 2 — Créer la base de données

Vos réglages de déploiement (identifiant de base, domaine d'équipe…) vont
dans une **copie locale** de la configuration, que Git ignore : ils ne
partent jamais sur GitHub et un `git pull` ne crée pas de conflit.

```sh
# macOS / Linux
cp wrangler.sync.jsonc wrangler.sync.local.jsonc
```

```powershell
# Windows PowerShell
Copy-Item wrangler.sync.jsonc wrangler.sync.local.jsonc
```

Puis créez la base :

```sh
bunx wrangler d1 create shy-safari
```

La commande affiche un bloc contenant `"database_id": "…"`. Ouvrez
**`wrangler.sync.local.jsonc`** et remplacez la valeur de `database_id`
(`00000000-0000-0000-0000-000000000000`) par celle affichée.

## Étape 3 — Créer les tables

```sh
bunx wrangler d1 migrations apply shy-safari --remote -c wrangler.sync.local.jsonc
```

Confirmez par `y`. Le tableau final doit montrer `0001_backups.sql ✅`.

## Étape 4 — Premier déploiement

Construisez le site avec son adresse définitive, puis déployez avec la
configuration de synchronisation :

```sh
# macOS / Linux
PUBLIC_SITE_URL=https://safari.exemple.fr bun run build
```

```powershell
# Windows PowerShell
$env:PUBLIC_SITE_URL="https://safari.exemple.fr"; bun run build
```

```sh
bunx wrangler deploy -c wrangler.sync.local.jsonc
```

Wrangler affiche une adresse `https://shy-safari.<compte>.workers.dev`. Le
site y fonctionne déjà, **sans** synchronisation pour l'instant (elle reste
inactive tant que l'étape 9 n'est pas faite : c'est voulu).

## Étape 5 — Brancher le sous-domaine

1. Tableau de bord → **Workers & Pages** → **shy-safari** → **Settings** →
   **Domains & Routes** → **Add** → **Custom domain**.
2. Saisissez `safari.exemple.fr` et validez.
3. Cloudflare crée l'enregistrement DNS et le certificat HTTPS (quelques
   minutes au plus).
4. Ouvrez **https://safari.exemple.fr** : Shy Safari s'affiche.

## Étape 6 — Fermer les autres adresses

Toujours dans **Domains & Routes** :

- **workers.dev** → **Disable** ;
- **Preview URLs** → **Disable**.

Ces adresses ne passent pas par la page de connexion : mieux vaut qu'elles
n'existent pas. (Le Worker refuse de toute façon de synchroniser sans jeton
Access valide.)

## Étape 7 — Préparer Cloudflare Zero Trust

1. Tableau de bord → **Zero Trust**. À la première visite, choisissez un
   **nom d'équipe** (par ex. `exemple`) et l'offre **Free** (jusqu'à 50
   utilisateurs ; une carte bancaire peut être demandée sans être débitée).
2. Notez votre **domaine d'équipe** : `https://<nom-d-equipe>.cloudflareaccess.com`.
   Il est visible dans **Settings** (rubrique _Team name and domain_ ;
   l'emplacement exact varie selon les versions du tableau de bord).
3. **Settings → Authentication → Login methods** : vérifiez que
   **One-time PIN** est présent (il l'est par défaut).

## Étape 8 — Créer l'application Access

1. **Zero Trust → Access → Applications → Add an application →
   Self-hosted**.
2. **Application name** : `Shy Safari`.
3. **Session duration** : `1 month` (l'ordinateur de classe ne redemande pas
   le code chaque matin).
4. **Application domain** : sous-domaine `safari`, domaine `exemple.fr`.
5. **Policy** :
   - Action : **Allow** ;
   - Include : **Emails** (l'adresse de chaque enseignant), ou **Emails
     ending in** `@votre-etablissement.fr` pour tout un domaine.
6. Enregistrez.
7. Rouvrez l'application et copiez son **Application Audience (AUD) Tag**
   (dans _Overview_ ou _Additional settings_) : une longue chaîne
   hexadécimale.

À partir de maintenant, https://safari.exemple.fr demande la connexion.

## Étape 9 — Activer la synchronisation

Dans **`wrangler.sync.local.jsonc`**, remplissez les deux variables :

```jsonc
"vars": {
  "ACCESS_TEAM_DOMAIN": "https://<nom-d-equipe>.cloudflareaccess.com",
  "ACCESS_AUD": "<AUD tag copié à l'étape 8>",
},
```

Puis redéployez (même build qu'à l'étape 4) :

```sh
bunx wrangler deploy -c wrangler.sync.local.jsonc
```

Ces valeurs ne sont pas secrètes (le Worker vérifie la signature du jeton
avec les clés publiques de votre équipe) ; elles restent de toute façon sur
votre ordinateur, dans le fichier ignoré par Git.

## Étape 10 — Vérifier

1. **La connexion** : ouvrez https://safari.exemple.fr dans une **fenêtre de
   navigation privée**. La page Cloudflare doit s'afficher. Saisissez une
   adresse autorisée, entrez le code reçu par e-mail : l'app s'ouvre.
   Avec une adresse non autorisée, l'accès est refusé.
2. **La synchronisation est active** : cliquez sur **Commencer**, puis ouvrez
   le menu de la classe (en haut à gauche) → **Modifier les classes**. Une rubrique **« Enregistré sur le
   serveur de votre établissement »** doit indiquer _Connecté en tant que
   votre@adresse_.
3. **Deux ordinateurs** (ou deux navigateurs) :
   - sur le premier, créez une classe nommée et faites sortir quelques
     animaux, puis cliquez sur **Enregistrer maintenant** ;
   - sur le second, connectez-vous avec la même adresse : la classe apparaît
     automatiquement (la page se recharge une fois).
4. Les journaux de connexion sont dans **Zero Trust → Logs → Access**.

## Mettre à jour

```sh
git pull
bun install
PUBLIC_SITE_URL=https://safari.exemple.fr bun run build   # ou la variante PowerShell
bunx wrangler d1 migrations apply shy-safari --remote -c wrangler.sync.local.jsonc   # si de nouvelles migrations existent
bunx wrangler deploy -c wrangler.sync.local.jsonc
```

Retour arrière : **Workers & Pages → shy-safari → Deployments**, ou
`bunx wrangler rollback`.

## Administrer

- **Ajouter / retirer un enseignant** : modifiez la policy de l'application
  Access (étape 8). Un retrait prend effet à la fin de sa session, ou tout
  de suite avec **Revoke existing tokens**.
- **Voir les enseignants synchronisés** :

  ```sh
  bunx wrangler d1 execute shy-safari --remote -c wrangler.sync.local.jsonc --command "SELECT email, revision, updated_at, size FROM backups"
  ```

- **Supprimer les données d'un enseignant** (son navigateur garde sa copie
  locale) :

  ```sh
  bunx wrangler d1 execute shy-safari --remote -c wrangler.sync.local.jsonc --command "DELETE FROM backup_chunks WHERE email = 'prof@exemple.fr'; DELETE FROM backups WHERE email = 'prof@exemple.fr';"
  ```

- **Revenir en arrière sur la base** : D1 garde un historique (Time Travel,
  7 jours sur l'offre gratuite) — voir `bunx wrangler d1 time-travel --help`.

## Dépannage

| Symptôme                                                                   | Cause probable et solution                                                                                                                                                                                                     |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pas de rubrique « Enregistré sur le serveur… » dans _Modifier les classes_ | La synchro est inactive : `ACCESS_TEAM_DOMAIN` ou `ACCESS_AUD` vide, ou déploiement fait avec `wrangler.jsonc` au lieu de `wrangler.sync.local.jsonc`. Ouvrez https://safari.exemple.fr/api/me : `503` = variables manquantes. |
| `/api/me` répond `401` alors que vous êtes connecté                        | Le domaine d'équipe ou l'AUD tag ne correspond pas à l'application Access : recopiez-les (sans `/` final pour le domaine d'équipe) et redéployez.                                                                              |
| « Votre connexion a expiré » dans l'app                                    | La session Access est finie : rechargez la page et reconnectez-vous. Rien n'est perdu.                                                                                                                                         |
| « Le serveur est injoignable »                                             | Problème réseau passager : l'app réessaie seule, les classes restent sur l'ordinateur.                                                                                                                                         |
| Une question « Quelles classes garder ? » apparaît                         | Les deux ordinateurs ont modifié la même chose (une note, les animaux d'une scène…) depuis le dernier enregistrement. Le reste est fusionné automatiquement.                                                                   |
| Le domaine personnalisé refuse de s'ajouter                                | Un enregistrement DNS `safari` existe déjà (étape 0).                                                                                                                                                                          |
| `wrangler deploy` échoue sur `database_id`                                 | L'identifiant de l'étape 2 n'a pas été recopié dans `wrangler.sync.local.jsonc`.                                                                                                                                               |

Version sans synchronisation (site statique seul) :
[hebergement.md](hebergement.md).
