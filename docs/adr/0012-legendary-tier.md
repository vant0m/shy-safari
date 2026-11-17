# A Legendary tier: one Creature per Scene, about one arrival in two hundred

Rares (10% of arrivals, three per Scene) turn up in most long Sessions, so a
class that uses the app every day stops treating them as an event. A fourth
tier gives the class something genuinely rare to hope for, without changing
how anything else arrives.

## Decisions

- **One Legendary per always-on Scene**, drawn in that Scene's style: a white
  lion (savanna), a leafy seadragon (reef), a flying saucer (deep space), a
  Torosaurus (prehistoric), a white stag with golden antlers (forest), a black
  panther (jungle) and a white orca (Arctic). Several are recolours or
  extensions of an existing Creature's artwork, which keeps them in the set's
  style and gives them a listening pose for free where the original had one.
- **Weight 0.5** next to 60 / 30 / 10 (`session/roll.ts`): about 0.5% of
  arrivals, so an hour at the Normal rate has roughly a one-in-twenty chance.
  The roll's renormalisation means it stays just over 0.5% once the Rares
  have all been seen.
- **At most once per Session**, not merely once while present like a Rare: a
  Legendary that Runs Away does not come back until Reset. The Session keeps
  the slugs that have come, per Class and Scene
  (`class-noise-level:class:<id>:<scene>:legends`), and passes them to the
  roll as present.
- **It looks the part**: it glows through every colour in turn, a ring of
  colour turns slowly round it, its sparkles are rainbow-coloured, and a
  rainbow arcs up over it as it arrives. It shimmers for three minutes rather
  than one. With reduced motion, the glow and the ring hold still and the
  rainbow is left out. The Collection gives it its own row and a rainbow
  frame, and its chance shows as "0.5%" rather than rounding to 0%.
- **Pumpkin Hollow has none.** It chooses its arrivals by the calendar
  (`scenes/halloween/arrivals.ts`), and its finale already plays this role.
