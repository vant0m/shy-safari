# Historique des versions

Les changements notables du projet. Format inspiré de
[Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versions
[SemVer](https://semver.org/lang/fr/). Version anglaise de référence :
[../../CHANGELOG.md](../../CHANGELOG.md).

## [Non publié]

### Ajouté

- **Chalet de Noël**, un second tableau à durée limitée en forme de
  calendrier de l'Avent (du 1er décembre 2026 au 8 janvier 2027) : une
  clairière enneigée à l'heure bleue, un chalet aux fenêtres dorées, de la
  fumée, de la neige et une guirlande lumineuse. Quatre créatures communes,
  puis un nouveau venu par jour d'école jusqu'au Père Noël le vendredi
  18 décembre, qui allume le sapin ; « trop fort » éteint les lumières. Dix-sept
  créatures, dont trois rennes reconnaissables à un signe et Rudolph, avec
  noms et anecdotes en anglais, espagnol et français
  ([ADR 0016](../adr/0016-christmas-chalet.md)).
- `dangle`, un mouvement pour les décorations suspendues à une guirlande.
- Workflows GitHub Actions, un par vérification (typecheck, tests, lint,
  build), chacun avec son badge dans le README.
- Captures et GIF du README dans `docs/images/`, et
  `docs/fr/fonctionnement.md` (anglais : `docs/how-it-works.md`).

### Modifié

- Les règles des tableaux à durée limitée (calendrier, arrivées des
  nouveaux venus, panneau, textes des menus, aperçu des personnages) sont
  partagées dans `src/lib/scenes/limited/` au lieu d'être propres à
  Pumpkin Hollow. Halloween se comporte comme avant.
- README (et son miroir français) restructuré : en-tête centré avec logo,
  badges et GIF de la scène ; sections numérotées avec emoji ; principes en
  tête ; une image par fonction ; détails repliables ; encadrés GitHub ;
  contributeurs ; liens « haut de page ».

### Corrigé

- Le README ne dit plus que rien ne s'enfuit quand c'est trop fort : par
  défaut, les animaux s'enfuient (ADR 0003).

## [1.0.0] — 2026-11-17

Première version maintenue pour un hébergement durable, à partir du prototype
de l'EdTech-a-thon de Duncan A. Johnson et Elliot Roe
([teacherdotdev/shy-safari](https://github.com/teacherdotdev/shy-safari)).

### Ajouté

- **Vallée enchantée**, 9e scène : les quatorze créatures de la branche
  `mythical-scene` branchées, plus un impundulu, un feu follet, un centaure et
  Pégase ; ambiance, brume lilas quand c'est trop fort, noms, anecdotes et
  aide en anglais, espagnol et français.
- **Palier Légendaire** : une créature par scène (lion blanc, dragon de mer
  feuillu, soucoupe volante, Torosaurus, cerf blanc, panthère noire, orque
  blanche, Pégase), environ une arrivée sur deux cents, au plus une fois par
  séance, sous un arc-en-ciel ; rangée et cadre arc-en-ciel dans la
  Collection.
- **Réglages par classe** : objectif de volume, fréquence d'arrivée, réaction
  au bruit et scène propres à chaque classe ; micro et calibration communs.
  Les réglages existants sont repris, jamais remis à zéro.
- **Exporter / Importer** toutes les classes dans un fichier JSON.
- **Statistiques par classe** : temps calme, part du temps sous l'objectif,
  séances, arrivées, fuites, rares et légendaires, niveau sonore moyen au fil
  de la journée face à l'objectif, comparatif des classes. 180 jours.
- **Synchronisation facultative entre ordinateurs** via un Worker Cloudflare
  et une base D1, sous l'e-mail de connexion Cloudflare Access :
  récupération silencieuse sur un nouvel ordinateur, fusion automatique des
  changements faits sur deux ordinateurs, question seulement si les deux ont
  changé la même chose, jamais de rechargement ni de question pendant une
  séance.
- Variables de build `PUBLIC_SITE_URL`, `DEV_ALLOWED_HOSTS`, `BUILD_VERSION`.
- `bun run dev:sync` pour lancer le Worker de synchronisation en local.
- Documentation en anglais et en français : lancement local pas à pas,
  hébergement, Cloudflare Access, déploiement pas à pas sur un sous-domaine
  avec synchronisation, ADR 0010 à 0015, index des ADR, `NOTICE`.

### Modifié

- La règle de données du projet (« pas de données, puis `localStorage`, puis
  Supabase seulement si strictement nécessaire ») est abandonnée : le
  `localStorage` reste le mode par défaut, la synchronisation serveur est une
  option.
- L'aide et la page Confidentialité décrivent la synchronisation quand elle
  est activée.
- Le README crédite le projet et les auteurs d'origine.

### Corrigé

- Le build pouvait produire une page qui ne démarrait pas (« Cannot read
  properties of undefined (reading 'data') ») : la version du build est
  désormais le commit git.
- `bun run lint` échouait sur tous les fichiers sous Windows (fins de ligne
  CRLF) : `.gitattributes` impose LF.
- Les couleurs affichées avant le chargement suivaient les anciens réglages
  communs au lieu de la classe affichée.
- Les copies auto-hébergées ne mentionnent plus shysafari.com dans l'aide, le
  sitemap et les liens.

## [0.0.1] — 2026-11

Le prototype de l'EdTech-a-thon publié sur
[teacherdotdev/shy-safari](https://github.com/teacherdotdev/shy-safari).
