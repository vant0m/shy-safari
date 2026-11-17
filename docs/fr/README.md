# Shy Safari — documentation en français

Une scène paisible au vidéoprojecteur — savane, récif de corail, espace
profond, préhistoire, forêt, jungle, Arctique, vallée enchantée — où des
animaux timides sortent
tant que la classe reste calme. Si la salle devient trop bruyante, ils restent
cachés (ou s'enfuient, selon le réglage) jusqu'au retour du calme.

C'est l'inverse d'un sonomètre : pas de score, pas d'aiguille, pas de voyant
rouge. Rien ne rend le bruit plus intéressant que le calme.

- [Utilisation en classe](#utilisation-en-classe)
- [Comment l'app juge le bruit](#comment-lapp-juge-le-bruit)
- [Données et vie privée](#données-et-vie-privée)
- [Développer](#développer)
- [Héberger](#héberger)

## Utilisation en classe

1. Ouvrez la page, choisissez une scène si vous le souhaitez, puis appuyez
   sur **Commencer**. Le navigateur demande le micro : le son est mesuré sur
   l'ordinateur, jamais enregistré ni envoyé.
2. La classe commence à gagner des animaux : le premier arrive après 10 à 20
   secondes de calme, puis environ un toutes les quelques minutes de travail
   calme. Certains sont rares.
3. Bougez la souris pour faire apparaître les commandes. **Réglages**
   regroupe tout : scène, micro, seuil « trop fort », rythme d'arrivée.

**Classes.** Créez une classe par groupe (« 6e B », « CM2 »…). Chaque classe
garde ses propres animaux dans chaque scène, sa Collection, ses Notes, son
Minuteur **et ses propres réglages** : objectif de volume, fréquence
d'arrivée, réaction au bruit et dernière scène utilisée. Le micro et sa
calibration appartiennent à la salle et restent communs. Changer de classe ne
mélange jamais rien ; supprimer une classe efface tout ce qu'elle gardait.

**Sauvegarde.** Dans le panneau Classes, « Exporter toutes les classes »
enregistre un fichier JSON ; « Importer un fichier… » le restaure sur un autre
ordinateur, navigateur ou adresse (cela remplace tout, sauf le micro et sa
calibration).

**Rareté.** Communs 60, peu communs 30, rares 10 et légendaires 0,5 (environ
0,5 % des arrivées). Chaque scène cache un animal légendaire (lion blanc,
dragon de mer feuillu, soucoupe volante, Torosaurus, cerf blanc, panthère
noire, orque blanche, Pégase) : il arrive au plus une fois par séance, sous un
arc-en-ciel.

**Statistiques.** Le bouton en forme de graphique affiche, par classe : temps
calme, part du temps sous l'objectif, arrivées, fuites, niveau sonore moyen au
fil de la journée (comparé à l'objectif) et un comparatif de toutes les
classes. Réservé à l'enseignant, conservé 180 jours sur cet ordinateur. Le
niveau est l'échelle 0–100 du sonomètre, pas des décibels.

**Synchronisation (facultative).** Déployée avec `wrangler.sync.jsonc`
derrière Cloudflare Access, une copie enregistre les classes de chaque
enseignant sur son compte Cloudflare, sous son e-mail : il les retrouve sur
tout ordinateur. Les modifications faites sur deux ordinateurs sont
fusionnées ; une question n'est posée que si les deux ont changé la même
chose. Guide : [deploiement-pas-a-pas.md](deploiement-pas-a-pas.md).

**Accès réservé.** Il se règle devant le site, pas dans l'app : Cloudflare
Access avec un code envoyé par e-mail, configuré par l'administrateur de
l'hébergement (voir [hebergement.md](hebergement.md)).

**Notes.** Écrivez ou dessinez une consigne qui s'intègre au décor (un nuage
dans la savane, un panneau sur le récif…).

**Minuteur.** Un compte à rebours déplaçable ; sa sonnerie n'est jamais
comptée comme du bruit.

**Fenêtre flottante.** La scène peut flotter au-dessus de vos diapositives
(Picture-in-Picture).

## Comment l'app juge le bruit

L'enseignant fixe un **Objectif de volume** : Silence, Travail individuel,
Travail à deux, ou n'importe où entre les deux en faisant glisser la ligne du
sonomètre.

Dépasser la ligne n'arrête rien instantanément : le bruit au-dessus de
l'objectif remplit un « seau », d'autant plus vite que l'on est loin
au-dessus (environ six secondes juste au-dessus, une seconde très
au-dessus). Les moments calmes le vident. Une porte qui claque ou un livre qui
tombe ne coûte donc rien. Le retour au calme ne prend que trois secondes.

Quand c'est trop fort, la scène se voile (brume, eau trouble, interférences,
blizzard…). Par défaut, les animaux déjà sortis commencent à s'enfuir ; dans
les réglages, on peut choisir que la scène se mette simplement en pause.

La **calibration** est facultative : cinq secondes de silence, cinq secondes
de conversation normale, et le sonomètre s'adapte à votre salle et à votre
micro.

## Données et vie privée

Par défaut, il n'y a ni compte ni serveur applicatif. Classes, animaux,
Collection, Notes, Minuteur et réglages sont stockés dans le `localStorage` du
navigateur, sur cet ordinateur et pour cette adresse uniquement (sauf si votre
établissement a activé la synchronisation : voir ci-dessus). Une fenêtre de navigation
privée oublie tout à la fermeture. Le son du micro n'est jamais enregistré ni
transmis.

## Développer

Guide pas à pas complet : **[lancer-en-local.md](lancer-en-local.md)**.

Prérequis : [Bun](https://bun.sh) 1.3 ou plus (sous Windows :
`powershell -c "irm bun.sh/install.ps1 | iex"`).

```sh
bun install      # une fois, puis après chaque changement de bun.lock
bun run dev      # serveur de dev sur http://localhost:5173

bun run check    # vérification TypeScript / Svelte
bun test         # tests unitaires
bun run lint     # prettier --check + eslint (bun run format corrige le style)
bun run build    # build statique de production dans build/
```

Pile technique : Svelte 5 + SvelteKit (prérendu statique, `adapter-static`),
Tailwind CSS, TypeScript. Chaque scène est du SVG dans le DOM (pas de canvas),
chaque animal un élément animé en CSS.

Repères dans le code :

| Fichier                             | Rôle                                                       |
| ----------------------------------- | ---------------------------------------------------------- |
| `src/lib/noise/loudState.ts`        | Hystérésis « lent à entrer, rapide à sortir ».             |
| `src/lib/session/arrivalClock.ts`   | Le temps calme accumulé, mis en pause et non remis à zéro. |
| `src/lib/session/roll.ts`           | Le tirage pondéré par rareté.                              |
| `src/lib/scenes/index.ts`           | Le registre des scènes.                                    |
| `src/lib/classes/classes.svelte.ts` | Les classes et leurs clés de stockage.                     |
| `src/lib/i18n/index.svelte.ts`      | Tous les textes (en / es / fr).                            |

Le vocabulaire du code est défini dans [`CONTEXT.md`](../../CONTEXT.md) et les
décisions d'architecture dans [`docs/adr/`](../adr/) (en anglais).

## Héberger

Voir le guide complet : **[hebergement.md](hebergement.md)** (Cloudflare,
domaine personnalisé, accès réservé par Cloudflare Access sans création de
compte pour les enseignants, autres hébergeurs).

## Crédits et licence

Shy Safari a été créé pendant l'EdTech-a-thon 2026 par
[Duncan A. Johnson](https://github.com/DuncanAJohnson) et
[Elliot Roe](https://github.com/ElliotRoe), et publié sur
[teacherdotdev/shy-safari](https://github.com/teacherdotdev/shy-safari). Cette
copie s'appuie sur leur travail ; l'[historique des versions](CHANGELOG.md)
liste les changements depuis. Licence Apache 2.0
([`LICENSE.txt`](../../LICENSE.txt)) ; voir [`NOTICE`](../../NOTICE).
