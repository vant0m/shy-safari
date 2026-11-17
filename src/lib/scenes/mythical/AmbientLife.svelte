<script lang="ts">
  /**
   * Scenery that is alive but is not a Creature: the waterfall pouring into
   * the lake, the lake glinting, blossom drifting down from the tree on the
   * left and specks of fairy light twinkling over the meadow. Present from
   * the first second of every Session, never earned, never counted.
   *
   * The backdrop (`ambient/backdrop.svg`) already holds the castle, the
   * hills, the trees and the flowers; this only brings it to life, and stays
   * subordinate: soft, slow, and without the signature eye every Creature
   * has. Positions are fixed rather than random, so the Scene looks the same
   * each time a teacher opens it.
   */

  import { AMBIENT_ART } from "$lib/scenes/mythical/artwork";

  /** Blossom falling from the tree on the left, each sheet on its own beat. */
  const petals = [
    { x: 2, duration: 34, delay: 0 },
    { x: 9, duration: 41, delay: -18 },
    { x: 16, duration: 38, delay: -29 },
  ];

  /**
   * Specks of fairy light over the meadow and the lake, as % of the Scene's
   * width (`x`) and height (`y`). Each twinkles on its own beat.
   */
  const glimmers = [
    { x: 24, y: 70, delay: 0 },
    { x: 33, y: 82, delay: -1.6 },
    { x: 47, y: 74, delay: -3.1 },
    { x: 58, y: 88, delay: -0.8 },
    { x: 66, y: 72, delay: -2.4 },
    { x: 79, y: 80, delay: -4 },
    { x: 41, y: 57, delay: -2 },
    { x: 72, y: 59, delay: -3.5 },
    { x: 14, y: 63, delay: -1.1 },
    { x: 88, y: 66, delay: -2.8 },
  ];

  /** Light catching the lake, drifting slowly along it. */
  const glints = [
    { x: 12, y: 57.2, width: 7, duration: 14, delay: 0 },
    { x: 46, y: 59.4, width: 9, duration: 18, delay: -6 },
    { x: 77, y: 58.1, width: 6, duration: 16, delay: -11 },
  ];
</script>

<!-- The waterfall: only its streaks move, over the painted falls. -->
<div
  class="mythical-falls pointer-events-none absolute top-[43.9%] h-[10.4%]"
  style="left:calc(var(--world-left) + 15.85 * var(--wu)); width:calc(2.3 * var(--wu));"
></div>

{#each glints as glint (glint.x)}
  <div
    class="mythical-glint pointer-events-none absolute"
    style="left:calc(var(--world-left) + {glint.x} * var(--wu)); top:{glint.y}%; width:calc({glint.width} * var(--wu)); animation-duration:{glint.duration}s; animation-delay:{glint.delay}s;"
  ></div>
{/each}

{#each glimmers as glimmer (`${glimmer.x}:${glimmer.y}`)}
  <div
    class="mythical-glimmer pointer-events-none absolute"
    style="left:calc(var(--world-left) + {glimmer.x} * var(--wu)); top:{glimmer.y}%; animation-delay:{glimmer.delay}s;"
  ></div>
{/each}

{#each petals as sheet (sheet.x)}
  <div
    class="mythical-petals pointer-events-none absolute top-[4%] h-[60%]"
    style="left:calc(var(--world-left) + {sheet.x} * var(--wu)); width:calc(9 * var(--wu)); animation-duration:{sheet.duration}s; animation-delay:{sheet.delay}s;"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html AMBIENT_ART.petal}
  </div>
{/each}
