# The Christmas chalet: a second limited-time Scene, with its whole Roster from day one

For Christmas there is a tenth Scene, the Christmas chalet: a Christmas
village at night under the northern lights. Jagged snowy mountains stand
behind it, a town glows far down the valley, and a path winds through the
snow. There are log chalets with glowing windows and string lights, smoke
rising from a chimney, lit fir trees framing both edges, a Christmas tree, a
lamp post and a candy-striped fence. Fine snow falls behind the Creatures
and big slow flakes in front of them.

It is open from Tuesday 1 December 2026 to Friday 8 January 2027
(`scenes/christmas/calendar.ts`), with its whole Roster from the first day.
After Christmas its sign and menu entry count down the days left. On
9 January it is gone from every menu and from the Collection, and nothing a
Class earned in it is deleted.

## Decisions

- **Limited-time Scenes have their whole Roster from day one.** Both Pumpkin
  Hollow and the Christmas chalet stay seasonal, but nothing unlocks day by
  day any more: arrivals are the usual roll, as in every other Scene. This
  supersedes the daily unlock and the Newcomer guarantee of
  [ADR 0009](0009-a-limited-time-scene.md).
  - Why: the class should not have to wait for the calendar to meet a
    Scene's characters.
  - Removed with it: the locked Collection cards, the "new today" sign and
    the character preview.
- **The rules are shared.** The dates and the sign's words live in
  `scenes/limited/registry.ts`, and the shared rules in
  `scenes/limited/calendar.ts`. Both are asked through `limitedOf(sceneId)`
  rather than by checking for `"halloween"`, so a third seasonal Scene only
  needs a new folder and a registry entry.
- **One scale for every Creature.** A person is about 100px tall against the
  1920px reference, about 55px a metre: the savanna's scale, and the height
  of the chalet's door at its depth.
  - Big things keep to it. Small things are drawn bigger than life so they
    stay readable, but never taller than an elf.
  - Jack O. Lantern (once 453px tall) and Father Christmas (225px) are now
    person-sized.
  - Both walk with `graze`, so their size follows the depth they stand at.
    The giant's `stride` lane, which kept them drawn large even at the back,
    is gone.
  - `scenes/proportions.test.ts` checks this.
- **A Christmas village at night**, after a reference picture the teacher
  chose.
  - The far things are the backdrop. Everything standing on the snow is
    scenery placed by depth, as on the savanna, so Creatures pass in front of
    some of it and behind the rest.
  - The lights are classes inside the inlined artwork: `christmas-window`,
    `christmas-bulb`, `christmas-tree-light`, `christmas-star-glow`.
- **Too Loud puts the village to sleep**, on top of what every Scene does
  (the haze, and Run Away or freeze, per Class). The windows, the lantern
  and the string lights fade right down, the northern lights fade away and
  the chimney stops smoking. It is never a fright and never a flash.
- **The Christmas tree is lit by the finale.** Father Christmas is the
  Scene's `welcomes`. While he is here the tree's lights fade in and its star
  glows (`christmas/entrance.css`), as Pumpkin Hollow's lanterns do for Jack
  O. Lantern.
- **Three named reindeer, each told apart by one mark**, rather than all
  nine. Nine near-identical reindeer would crowd a Roster of seventeen.
  - Comet has a white star on his muzzle.
  - Cupid has a heart on her flank.
  - Blitzen has a darker coat with a lightning bolt.
  - Each wears a different coloured collar. Rudolph, a Rare, flies with his
    glowing nose.
- **Decorations wear the signature face** and fade away rather than run.
  The bauble, the stocking and the cracker float.
- **No Legendary**, like Pumpkin Hollow.
- **Nothing religious.** The Scene has Father Christmas, reindeer, elves,
  decorations and winter animals only.

## Consequences

The forest already had an American `robin`, so the Christmas one is
`european-robin`. The old per-Class `halloween-newcomer` keys in
localStorage are no longer read; they are left alone rather than deleted.
Bringing either Scene back next year is a matter of new dates in its
`calendar.ts`.
