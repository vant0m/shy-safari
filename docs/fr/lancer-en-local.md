# Lancer Shy Safari en local, pas à pas

Ce guide part d'un ordinateur vierge et va jusqu'à l'app qui tourne dans le
navigateur, puis jusqu'à la version de production testée localement. Comptez
une dizaine de minutes la première fois.

Version anglaise : [../running-locally.md](../running-locally.md).

- [Étape 1 — Installer les outils](#étape-1--installer-les-outils)
- [Étape 2 — Récupérer le code](#étape-2--récupérer-le-code)
- [Étape 3 — Installer les dépendances](#étape-3--installer-les-dépendances)
- [Étape 4 — Lancer le serveur de développement](#étape-4--lancer-le-serveur-de-développement)
- [Étape 5 — Essayer l'app sans attendre](#étape-5--essayer-lapp-sans-attendre)
- [Étape 6 — Tester la version de production](#étape-6--tester-la-version-de-production)
- [Étape 7 — Vérifier avant de commiter](#étape-7--vérifier-avant-de-commiter)
- [Options utiles](#options-utiles)
- [Dépannage](#dépannage)

## Étape 1 — Installer les outils

Il faut **Git** et **Bun** (Bun sert à la fois d'exécuteur JavaScript et de
gestionnaire de paquets ; pas besoin de Node ni de npm).

**Windows** (PowerShell) :

```powershell
winget install Git.Git          # si Git n'est pas déjà installé
powershell -c "irm bun.sh/install.ps1 | iex"
```

**macOS / Linux** :

```sh
# Git : déjà présent sur la plupart des systèmes (sinon : brew install git / apt install git)
curl -fsSL https://bun.sh/install | bash
```

Puis **fermez et rouvrez le terminal** (Bun s'ajoute au `PATH` à l'ouverture
d'un nouveau terminal) et vérifiez :

```sh
git --version
bun --version     # 1.3 ou plus
```

Un navigateur récent est nécessaire : Chrome, Edge ou Firefox. La fenêtre
flottante (Picture-in-Picture) ne fonctionne que dans Chrome et Edge.

## Étape 2 — Récupérer le code

```sh
git clone https://github.com/vant0m/shy-safari.git
cd shy-safari
```

Si le dépôt est déjà sur la machine, placez-vous simplement dans son dossier
et mettez-le à jour avec `git pull`.

## Étape 3 — Installer les dépendances

```sh
bun install
```

À refaire après chaque `git pull` qui modifie `bun.lock`. Le dossier
`node_modules/` créé n'est jamais commité.

## Étape 4 — Lancer le serveur de développement

```sh
bun run dev
```

Le terminal affiche une adresse, normalement **http://localhost:5173**.
Ouvrez-la dans le navigateur, puis :

1. Choisissez une scène (Savane par défaut).
2. Cliquez sur **Commencer**.
3. Le navigateur demande l'accès au micro : acceptez. Le son est mesuré sur
   l'ordinateur, il n'est ni enregistré ni envoyé.

Le serveur recharge la page automatiquement à chaque modification d'un
fichier dans `src/`. Pour l'arrêter : **Ctrl + C** dans le terminal.

## Étape 5 — Essayer l'app sans attendre

En temps normal, il faut plusieurs minutes de calme par animal. Pour tout voir
tout de suite :

- Bougez la souris pour afficher les commandes, puis **Réglages → Essayer →
  Faire sortir tous les animaux** : toute la scène se remplit (légendaire
  compris, avec son effet arc-en-ciel). Ces animaux ne comptent pas dans la
  Collection.
- Dans **Réglages**, choisissez **Animé** (un animal toutes les 2 minutes) ou
  tapez **1** minute pour accélérer les vraies arrivées.
- **Réinitialiser** (barre du bas) vide la scène de la classe affichée.
- Le bouton **Statistiques** (en bas à droite) se remplit pendant qu'une
  séance tourne.
- Pour repartir de zéro : outils de développement du navigateur (**F12**) →
  **Application** → **Stockage local** → `http://localhost:5173` →
  supprimez les clés qui commencent par `class-noise-level:`.

Le stockage local est propre à chaque adresse : les données de
`localhost:5173` (dev) et de `localhost:4173` (production, étape 6) sont
séparées.

## Étape 6 — Tester la version de production

C'est la version qui est réellement mise en ligne : des fichiers statiques
dans `build/`.

```sh
bun run build
bun run preview
```

Ouvrez **http://localhost:4173**. Pour reproduire exactement le comportement
de Cloudflare (en-têtes de cache, redirections de `static/_headers` et
`static/_redirects`) :

```sh
bun run build
bunx wrangler dev
```

puis ouvrez l'adresse affichée (normalement **http://localhost:8787**).

Après un nouveau `bun run build`, **relancez** `bun run preview` : un serveur
de preview déjà démarré continue de servir les anciens fichiers et la page
peut rester blanche.

## Étape 7 — Vérifier avant de commiter

```sh
bun run check    # vérification TypeScript / Svelte
bun test         # tests unitaires
bun run lint     # style (Prettier) + ESLint
bun run build    # le build de production passe
```

Si `bun run lint` signale des problèmes de style, `bun run format` les corrige
automatiquement.

## Options utiles

Variables d'environnement, toutes facultatives :

| Variable            | À quoi elle sert                                                           |
| ------------------- | -------------------------------------------------------------------------- |
| `PUBLIC_SITE_URL`   | Adresse publique du site, utilisée dans les liens, le sitemap et l'aide.   |
| `CF_BEACON_TOKEN`   | Active Cloudflare Web Analytics (à laisser vide en local).                 |
| `DEV_ALLOWED_HOSTS` | Noms d'hôte acceptés par le serveur de dev derrière un tunnel ou un proxy. |
| `BUILD_VERSION`     | Nom de version du build (par défaut : le commit git).                      |

Pour en définir une le temps d'une commande :

```sh
# macOS / Linux
PUBLIC_SITE_URL=https://calme.exemple.fr bun run build
```

```powershell
# Windows PowerShell
$env:PUBLIC_SITE_URL="https://calme.exemple.fr"; bun run build
```

**Changer de port** : `bun run dev -- --port 3000`.

**Ouvrir depuis une tablette ou un autre PC du réseau** :
`bun run dev -- --host`, puis l'adresse `http://<IP-de-l-ordinateur>:5173`.
La page s'affiche, mais **le micro ne fonctionnera pas** : les navigateurs ne
l'autorisent qu'en HTTPS ou sur `localhost`. Pour tester le micro sur un autre
appareil, passez par un tunnel HTTPS et ajoutez son nom d'hôte à
`DEV_ALLOWED_HOSTS`.

## Dépannage

| Symptôme                                                         | Solution                                                                                                                                                                             |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bun : terme non reconnu` / `command not found`                  | Fermez et rouvrez le terminal après l'installation. Sous Windows, Bun est dans `%USERPROFILE%\.bun\bin`.                                                                             |
| `bun install` échoue                                             | Mettez Bun à jour : `bun upgrade`.                                                                                                                                                   |
| `Port 5173 is in use`                                            | Un autre serveur tourne déjà : arrêtez-le, ou utilisez `--port`.                                                                                                                     |
| Pas de demande de micro / « micro bloqué »                       | Cliquez sur l'icône à gauche de l'adresse et autorisez le micro pour ce site. Vérifiez que vous êtes bien sur `localhost`.                                                           |
| Aucun micro dans la liste                                        | Branchez-en un, puis rechargez la page ; vérifiez que le système autorise le navigateur à utiliser le micro.                                                                         |
| Page blanche avec `bun run preview`                              | Arrêtez le preview (Ctrl + C), refaites `bun run build`, relancez `bun run preview`.                                                                                                 |
| `bun run lint` échoue sur presque tous les fichiers sous Windows | Fins de ligne CRLF : le dépôt impose LF via `.gitattributes`. Sur une copie faite avant ce fichier, lancez `git rm --cached -r . && git reset --hard` (sans modifications en cours). |
| Les animaux ou classes ont « disparu »                           | Vous êtes sur une autre adresse (`5173` / `4173` / `8787`) ou dans une fenêtre privée : chacune a son propre stockage.                                                               |

Pour mettre le site en ligne, voir [hebergement.md](hebergement.md).
