# Historique des versions

Les changements notables du projet. Format inspiré de
[Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versions
[SemVer](https://semver.org/lang/fr/). Version anglaise de référence :
[../../CHANGELOG.md](../../CHANGELOG.md).

## [Non publié]

## [1.1.0] — 2026-11-21

Un tableau de Noël avec un légendaire qui se forme à partir de trois rares,
une seule échelle pour toutes les créatures, et un menu debug pour tester
l'app sans micro.

### Ajouté

- **Chalet de Noël**, un second tableau à durée limitée (du 1er décembre
  2026 au 8 janvier 2027) : un village de Noël la nuit sous les aurores
  boréales, avec chalets, sapins illuminés, lampadaire, clôture en sucre
  d'orge, fumée de cheminée et neige qui tombe. Le Père Noël allume le
  sapin ; « trop fort » éteint les lumières du village et l'aurore.
  Vingt et une créatures, dont six rennes reconnaissables à un signe et
  Rudolph, avec noms et anecdotes en anglais, espagnol et français
  ([ADR 0016](../adr/0016-christmas-chalet.md)).
- **Traîneau du Père Noël**, un légendaire qui se forme quand Rudolph, le
  Père Noël et le traîneau sont tous à l'écran, fêté par la balade en
  traîneau : il fait des boucles dans le ciel étoilé en laissant une traînée
  dorée. La salle n'est pas jugée pendant ce temps.
- Un menu debug, avec `bun run dev` uniquement : faux micro réglable à la
  main, date simulée, horloge des arrivées accélérée et arrivées à la
  demande ([lancer-en-local.md](lancer-en-local.md)). Il est absent des
  versions de production.
- Workflows GitHub Actions, un par vérification (typecheck, tests, lint,
  build), chacun avec son badge dans le README.
- Captures et GIF du README dans `docs/images/`, et
  `docs/fr/fonctionnement.md` (anglais : `docs/how-it-works.md`).

### Modifié

- Les tableaux à durée limitée (Pumpkin Hollow, chalet de Noël) restent
  saisonniers mais toutes leurs créatures peuvent arriver dès le premier
  jour : plus de déblocage quotidien, de nouveau venu garanti, de cartes
  verrouillées dans la Collection ni d'aperçu des personnages. Leurs règles
  sont partagées dans `src/lib/scenes/limited/`.
- Une seule échelle pour toutes les créatures (une personne mesure environ
  100 px sur la référence de 1920 px) : tailles corrigées pour Halloween et
  Noël, Jack O. Lantern et le Père Noël à taille humaine ; vérifié par un
  test des proportions.
- README (et son miroir français) restructuré : en-tête centré avec logo,
  badges et GIF de la scène ; sections numérotées avec emoji ; principes en
  tête ; une image par fonction ; détails repliables ; encadrés GitHub ;
  contributeurs ; liens « haut de page ».

### Corrigé

- Les scintillements d'un rare et le halo arc-en-ciel d'un légendaire ne
  disparaissent plus quand la classe change de tableau puis revient, ni au
  rechargement : ils continuent le temps qu'il leur restait (une minute,
  trois pour un légendaire).
- Une fois le traîneau du Père Noël formé, Rudolph, le Père Noël et le
  traîneau ne reviennent plus à côté de lui.
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
