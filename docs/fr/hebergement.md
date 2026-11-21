# Héberger Shy Safari

Shy Safari se compile en simples fichiers statiques (`bun run build` →
`build/`). Pas de code serveur, pas de base de données : tout ce que gagne une
classe est gardé dans le navigateur de l'enseignant. Héberger l'app consiste à
servir ces fichiers en HTTPS depuis une adresse stable.

Version anglaise : [../hosting.md](../hosting.md).

- [Avant de commencer](#avant-de-commencer)
- [Option A — Cloudflare, depuis votre ordinateur](#option-a--cloudflare-depuis-votre-ordinateur)
- [Option B — Cloudflare, compilé depuis GitHub à chaque push](#option-b--cloudflare-compilé-depuis-github-à-chaque-push)
- [Votre propre domaine](#votre-propre-domaine)
- [Restreindre l'accès avec Cloudflare Access](#restreindre-laccès-avec-cloudflare-access)
- [Synchronisation entre ordinateurs (facultative)](#synchronisation-entre-ordinateurs-facultative)
- [Autres hébergeurs statiques](#autres-hébergeurs-statiques)
- [Mettre à jour et revenir en arrière](#mettre-à-jour-et-revenir-en-arrière)
- [Dépannage](#dépannage)

## Avant de commencer

Deux règles, quel que soit l'hébergeur :

1. **HTTPS.** Les navigateurs ne donnent le micro qu'aux pages sécurisées.
   `localhost` est considéré comme sûr pour le développement ; tout le reste
   exige HTTPS.
2. **Une seule adresse canonique.** Animaux, Collection, Notes, Minuteur et
   réglages vivent dans le `localStorage`, qui appartient à une origine
   exacte (schéma + hôte + port). `https://exemple.fr` et
   `https://www.exemple.fr` sont deux stockages distincts : un enseignant qui
   utilise les deux voit deux jeux de classes différents. Choisissez une
   adresse, redirigez toutes les autres vers elle, et n'en changez plus une
   fois les enseignants installés. En cas de déménagement, chacun peut
   transférer ses classes avec **Exporter / Importer** dans le panneau Classes.

Définissez `PUBLIC_SITE_URL` à la compilation avec cette adresse canonique (par
exemple `https://calme.exemple.fr`). Elle sert aux liens canoniques, au
sitemap, aux aperçus de lien et à la phrase « Ouvrez … sur l'ordinateur » de
l'aide. Sans elle, la valeur par défaut est `https://www.shysafari.com`.

`CF_BEACON_TOKEN` est facultatif et n'ajoute que Cloudflare Web Analytics.
Sans lui, le site ne charge aucun script de statistiques.

## Option A — Cloudflare, depuis votre ordinateur

Cloudflare Workers sait servir des fichiers statiques sans aucun script
Worker : c'est gratuit et sans limite de requêtes. `wrangler.jsonc` décrit
déjà cette configuration.

1. Créez un compte Cloudflare gratuit.
2. Installez [Bun](https://bun.sh) puis les dépendances :

   ```sh
   bun install
   ```

3. Changez `"name"` dans `wrangler.jsonc` si vous ne voulez pas `shy-safari`
   comme nom dans le tableau de bord (c'est aussi l'adresse
   `<nom>.<compte>.workers.dev`).
4. Connectez-vous et déployez :

   ```sh
   bunx wrangler login
   PUBLIC_SITE_URL=https://calme.exemple.fr bun run build
   bunx wrangler deploy
   ```

   Sous Windows PowerShell, définissez d'abord la variable :
   `$env:PUBLIC_SITE_URL="https://calme.exemple.fr"; bun run build`.

Wrangler affiche l'adresse `*.workers.dev`. Le site y fonctionne tout de
suite ; ajoutez ensuite votre domaine.

## Option B — Cloudflare, compilé depuis GitHub à chaque push

1. Poussez le dépôt sur GitHub (ou GitLab).
2. Dans le tableau de bord Cloudflare : **Workers & Pages → Create → Import a
   repository**, et choisissez-le.
3. Paramètres de build :

   | Paramètre         | Valeur                         |
   | ----------------- | ------------------------------ |
   | Build command     | `bun install && bun run build` |
   | Deploy command    | `bunx wrangler deploy`         |
   | Root directory    | `/`                            |
   | Production branch | `main`                         |

4. **Settings → Variables and secrets → Build variables** : ajoutez
   `PUBLIC_SITE_URL` (et `CF_BEACON_TOKEN` si vous voulez des statistiques).
5. Chaque push sur `main` compile et déploie ; les autres branches reçoivent
   une URL d'aperçu.

## Votre propre domaine

1. Ajoutez le domaine à Cloudflare (ses serveurs de noms doivent pointer vers
   Cloudflare), ou utilisez un sous-domaine d'un domaine déjà présent.
2. **Workers & Pages → votre Worker → Settings → Domains & Routes → Add →
   Custom domain**, puis saisissez l'hôte canonique, par ex. `www.exemple.fr`
   ou `calme.exemple.fr`. Cloudflare crée l'enregistrement DNS et le
   certificat.
3. Si vous utilisez `www.`, ajoutez aussi le domaine nu comme custom domain et
   redirigez-le : **Rules → Redirect Rules → Create rule** avec le modèle
   « Redirect from root to WWW » (301, conserver chemin et paramètres). Même
   principe dans l'autre sens si le domaine nu est votre adresse canonique.
4. Facultatif : désactivez l'adresse `workers.dev` (**Domains & Routes →
   workers.dev → Disable**) pour que personne ne l'utilise par erreur : ce
   serait une seconde origine, avec ses propres classes séparées.
5. Recompilez avec `PUBLIC_SITE_URL` = l'adresse canonique.

## Restreindre l'accès avec Cloudflare Access

L'app elle-même n'a pas de connexion. Pour réserver votre copie à votre
établissement, placez
[Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/)
devant. Rien ne change dans le code, et **les enseignants ne créent ni compte
ni mot de passe** : c'est l'administrateur du compte Cloudflare qui décide qui
peut entrer.

Côté enseignant :

1. Il ouvre le site et tombe sur une page de connexion Cloudflare.
2. Il saisit son adresse e-mail. Si elle figure dans la liste autorisée,
   Cloudflare lui envoie un code à 6 chiffres (« one-time PIN »).
3. Il saisit le code et arrive sur Shy Safari. Il reste connecté pendant la
   durée de session choisie (par exemple un mois) : l'ordinateur du
   vidéoprojecteur ne redemande pas chaque matin.

Si l'établissement utilise Google Workspace ou Microsoft 365, on peut aussi
proposer la connexion avec ce compte au lieu du code.

Mise en place (une fois, par l'administrateur) :

1. Le domaine doit être sur Cloudflare (voir plus haut). Pour la seule adresse
   `workers.dev`, utilisez plutôt **Worker → Settings → Domains & Routes →
   workers.dev → Enable Cloudflare Access**, puis modifiez la règle créée.
2. Ouvrez **Zero Trust** depuis le tableau de bord et choisissez l'offre Free
   (jusqu'à 50 utilisateurs ; une carte ou PayPal est demandé mais rien n'est
   débité sur l'offre Free). Le nom d'équipe peut être imposé : n'importe
   lequel convient.
3. **Integrations → Identity providers → Add new identity provider →
   One-time PIN** (il n'est plus activé d'office sur les nouveaux comptes).
   Ajoutez Google ou Microsoft (Azure AD) ici si besoin.
4. **Access controls → Applications → Create new application → Public DNS**
   (selon la version : _Self-hosted and private → Add public hostname_) :
   - Application name : `Shy Safari`.
   - Session duration : par ex. `1 month`.
   - Application domain : votre hôte canonique, par ex. `www.exemple.fr`.
     Ajoutez une deuxième entrée pour le domaine nu (`exemple.fr`) s'il
     redirige, pour protéger aussi la redirection.
5. Ajoutez une règle (policy) :
   - Action : **Allow**.
   - Include : **Emails** (listez l'adresse de chaque enseignant), ou
     **Emails ending in** `@ecole.exemple.fr` pour autoriser tout un domaine.
6. Enregistrez. Le site demande désormais le code ; ajoutez ou retirez des
   enseignants en modifiant la règle. Un retrait prend effet à la fin de la
   session en cours (ou tout de suite via **Revoke existing tokens**).

### Vérifier que l'accès est bien protégé

Cloudflare Access fonctionne chez Cloudflare, devant le site : il n'apparaît
jamais en local, ni avec `bun run dev` ni avec `bunx wrangler dev`. Pour le
voir :

1. Déployez (option A ou B). Pour essayer sans toucher au site des
   enseignants, déployez une copie de test sous un autre nom :
   `bunx wrangler deploy --name shy-safari-test`, et protégez son adresse
   `workers.dev` comme à l'étape 1 ci-dessus.
2. Ouvrez l'adresse protégée dans une **fenêtre de navigation privée** (sans
   session Cloudflare déjà ouverte) : la page de connexion Cloudflare doit
   s'afficher avant l'app.
3. Saisissez une adresse autorisée : le code arrive par e-mail, et l'app
   s'ouvre. Avec une adresse non autorisée, Cloudflare refuse l'accès.
4. **Zero Trust → Logs → Access** liste chaque tentative, acceptée ou refusée.

Remarques :

- Les pages « À propos » et « Confidentialité » sont protégées aussi. Pour les
  laisser publiques, ajoutez une seconde application pour
  `www.exemple.fr/about` (et `/privacy`) avec une règle **Bypass** incluant
  **Everyone**.
- Chaque personne qui se connecte occupe une des 50 places gratuites.
- Access est un vrai contrôle chez Cloudflare : les fichiers ne sont jamais
  envoyés à quelqu'un qui ne s'est pas connecté. Il ne sépare pas les
  enseignants entre eux dans l'app : chaque navigateur garde ses propres
  classes.

## Synchronisation entre ordinateurs (facultative)

Par défaut, tout reste dans chaque navigateur. Une copie protégée par
Cloudflare Access peut aussi enregistrer les classes de chaque enseignant
sur son compte Cloudflare (une base D1), sous l'e-mail utilisé pour se
connecter : il les retrouve alors sur n'importe quel ordinateur. Il suffit de
déployer avec `wrangler.sync.jsonc` au lieu de `wrangler.jsonc`. Seules les
adresses `/api/*` exécutent un Worker ; les pages restent des fichiers
statiques.

Toute la mise en place, d'un compte Cloudflare vide jusqu'à deux ordinateurs
synchronisés : **[deploiement-pas-a-pas.md](deploiement-pas-a-pas.md)**.
Conception et limites : [ADR 0015](../adr/0015-sync-through-cloudflare.md).

## Autres hébergeurs statiques

Tout hébergeur qui sert des fichiers statiques en HTTPS convient. Compilez
avec `PUBLIC_SITE_URL`, puis publiez le dossier `build/`.

Pas de Bun ? La
[page Release](https://github.com/vant0m/shy-safari/releases) de chaque
version propose le site déjà compilé, `shy-safari-X.Y.Z.zip` : décompressez-le
et publiez son contenu. Il est compilé sans `PUBLIC_SITE_URL`, donc les aperçus
de lien n'ont pas d'image ; compilez-le vous-même pour cela.

- **Netlify** : build command `bun run build`, publish directory `build`.
  `static/_headers` et `static/_redirects` sont au format Netlify et sont pris
  en compte tels quels.
- **GitHub Pages / GitLab Pages** : publiez `build/`. Le site doit être à la
  racine de son domaine (domaine personnalisé ou `<utilisateur>.github.io`),
  pas dans un sous-chemin, sauf à régler `paths.base` dans la config
  SvelteKit. Les en-têtes de cache de `_headers` y sont ignorés ; rien ne
  casse.
- **Votre serveur (nginx, Apache, Caddy)** : copiez `build/` à la racine web.
  Servez `404.html` pour les chemins absents, redirigez `/how-it-works` vers
  `/#how-it-works`, et donnez à `/_app/immutable/*` un cache long
  (`Cache-Control: public, max-age=31536000, immutable`). Avec nginx :

  ```nginx
  location /_app/immutable/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
  location = /how-it-works { return 301 /#how-it-works; }
  error_page 404 /404.html;
  try_files $uri $uri.html $uri/ =404;
  ```

  Pour une connexion sans Cloudflare, l'authentification HTTP basique du
  serveur (`auth_basic` avec nginx) est l'équivalent le plus simple.

## Mettre à jour et revenir en arrière

- Option A : `git pull`, `bun install`, compilez, puis `bunx wrangler deploy`.
- Option B : poussez sur `main`.
- Retour arrière depuis **Worker → Deployments**, ou `bunx wrangler rollback`.

Une mise à jour ne touche jamais aux données des enseignants : elles restent
dans leur navigateur. Quand le format de stockage change, le code migre les
anciennes clés : une mise à jour ne doit jamais vider une classe.

## Dépannage

- **« Micro bloqué » / pas de demande d'autorisation** : la page n'est pas en
  HTTPS, ou l'autorisation du site a été refusée. Vérifiez le cadenas.
- **Les classes d'un enseignant ont « disparu »** : il est presque toujours
  sur une autre origine (`www` ou non, `workers.dev` ou domaine perso, autre
  navigateur ou profil). Revenez à l'adresse habituelle ; utilisez Exporter /
  Importer pour les déplacer définitivement.
- **Les fenêtres privées** oublient tout à la fermeture.
- **`bun install` échoue** : le lockfile demande Bun 1.3+ ; lancez
  `bun upgrade`.
