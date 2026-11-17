# Shy Safari — documentation en français

Une scène paisible au vidéoprojecteur — savane, récif de corail, espace
profond, préhistoire, forêt, jungle, Arctique — où des animaux timides sortent
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
garde ses propres animaux dans chaque scène, sa Collection, ses Notes et son
Minuteur ; changer de classe ne mélange jamais rien. Supprimer une classe
efface tout ce qu'elle gardait.

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

Il n'y a ni compte ni serveur applicatif. Classes, animaux, Collection, Notes,
Minuteur et réglages sont stockés dans le `localStorage` du navigateur, sur
cet ordinateur et pour cette adresse uniquement. Une fenêtre de navigation
privée oublie tout à la fermeture. Le son du micro n'est jamais enregistré ni
transmis.

## Développer

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
