# The Christmas chalet: a second limited-time Scene, as an Advent calendar

For Christmas there is a tenth Scene, the Christmas chalet: a snowy
clearing at the foot of a mountain at the blue hour, with a log chalet whose
windows glow gold, smoke rising from its chimney, fine snow falling behind
the Creatures and big slow flakes in front, a garland of lights strung
across the top and an unlit Christmas tree on the right. It is open from
Tuesday 1 December 2026 to Friday 8 January 2027
(`scenes/christmas/calendar.ts`) and works exactly like Pumpkin Hollow
([ADR 0009](0009-a-limited-time-scene.md)): it opens with four Commons, then
gains one Newcomer every school day, thirteen in all, ending on the last day
of term, Friday 18 December, with Father Christmas. After Christmas its sign
and menu entry count down the days left; on 9 January it is gone from every
menu and from the Collection, and nothing a Class earned in it is deleted.

## Decisions

- **The limited-time rules are shared**, not copied. Pumpkin Hollow's
  calendar, Newcomer arrivals, menu wording, sign and character preview moved
  to `scenes/limited/` and take a calendar (`LimitedCalendar`). Each
  limited-time Scene declares its calendar and its sign's words in
  `scenes/limited/registry.ts`. Halloween's dates and its storage key
  (`halloween-newcomer`) are unchanged, so no Class loses its progress.
- **An Advent calendar.** It opens on the first day of Advent, so the
  calendar starts when the class expects it to, with four Commons rather
  than three so the first days are not thin. Commons are decorations come to
  life, then elves, three named reindeer and Mrs Claus, then the Rares: the
  sleigh, Rudolph and Father Christmas.
- **Blue hour, not night or day.** Golden windows and string lights stand
  out, white Creatures (the snowman, the snow on everything) stay readable on
  the snow, and it looks nothing like the Arctic's daylight sea ice. Fine
  snow plus big flakes, not the Arctic's even snowfall.
- **Too Loud puts the lights out**, on top of what every Scene does (the
  haze, and Run Away or freeze, per Class): the windows and the string
  lights fade right down, the chimney stops smoking, and the blue hour turns
  to night. It is a quiet, dark chalet, never a fright and never a flash.
- **The tree is scenery, lit by the finale.** A tree that walks about would
  be odd; instead Father Christmas is the Scene's `welcomes`, and the tree's
  lights come on and its star glows while he is here
  (`christmas/entrance.css`), as Pumpkin Hollow's lanterns flare for Jack O.
  Lantern.
- **Three named reindeer, each told apart by one mark**, rather than all
  nine: Comet has a white star on his muzzle, Cupid a heart on her flank,
  Blitzen a darker coat with a lightning bolt; each wears a different
  coloured collar. Nine near-identical reindeer would crowd a Roster of
  seventeen. Rudolph, the Rare, flies with his glowing nose.
- **A new motion, `dangle`.** The bauble and the stocking hang from the
  garland across the top of the backdrop and slide slowly along it
  (`GARLAND` in `scenes/motion.ts`); the garland is drawn straight so
  everything on it touches it.
- **Decorations wear the signature face** (eye, highlight, blush), as
  Pumpkin Hollow's ghosts and moon do, and fade away rather than run, as do
  the sleigh and Father Christmas (`departure: "fade"`).
- **No Legendary**, like Pumpkin Hollow: it chooses its own arrivals.
- **Nothing religious**: Father Christmas, reindeer, elves, decorations and
  winter animals only, so it suits any school.

## Consequences

The menus, the Collection, the sign and Settings ask `limitedOf(sceneId)`
instead of checking for `"halloween"`, so a third seasonal Scene is a new
folder and a registry entry. The slug `robin` was already the forest's
American robin, so the Christmas one is `european-robin`. Bringing the
chalet back next year is a matter of new dates in one file.
