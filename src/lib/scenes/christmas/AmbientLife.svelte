<script lang="ts">
  /**
   * Scenery that is alive but is not a Creature: snow falling, fine behind
   * the Creatures and in big slow flakes in front, smoke rising from the
   * chalet's chimney, and a few stars twinkling. The windows glowing and the
   * string lights twinkling are in the backdrop itself (`ambient/backdrop.svg`,
   * classes `christmas-window`, `christmas-bulb`), lit by `scene.css`, so Too
   * Loud can turn them down and Father Christmas can light the tree.
   *
   * Present from the first second of every Session, never earned, never
   * counted. Soft, slow and without the signature eye every Creature has.
   * Positions are fixed rather than random, so the Scene looks the same each
   * time a teacher opens it.
   */

  import { AMBIENT_ART } from "$lib/scenes/christmas/artwork";

  /**
   * The snow, as on the sea ice: each sheet is a column of three copies of
   * one tile, so it loops without a seam. The fine snow falls behind every
   * Creature, the big flakes in front of them.
   */
  const snowfalls = [
    { art: "snow-fine", layer: 0, duration: 80 },
    { art: "snow-big", layer: 1500, duration: 52 },
  ];

  /** Puffs of smoke leaving the chimney one after another. */
  const puffs = [0, -3.5, -7, -10.5, -14];

  /** Stars that twinkle, as % of the world's width (`x`) and the Scene's height (`y`). */
  const stars = [
    { x: 12, y: 24, delay: 0 },
    { x: 37, y: 21, delay: -2.2 },
    { x: 49, y: 30, delay: -4.1 },
    { x: 66, y: 22, delay: -1.3 },
    { x: 78, y: 33, delay: -3.4 },
    { x: 93, y: 26, delay: -5.2 },
  ];
</script>

{#each stars as star (star.x)}
  <div
    class="christmas-star-twinkle pointer-events-none absolute"
    style="left:calc(var(--world-left) + {star.x} * var(--wu)); top:{star.y}%; animation-delay:{star.delay}s;"
  ></div>
{/each}

<!-- The chimney's top is at 552, 346 in the backdrop's 1920 by 1080. -->
<div
  class="christmas-smoke pointer-events-none absolute"
  style="left:calc(var(--world-left) + 28.75 * var(--wu)); top:32%;"
>
  {#each puffs as delay (delay)}
    <div class="christmas-puff" style="animation-delay:{delay}s;">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html AMBIENT_ART.smoke}
    </div>
  {/each}
</div>

{#each snowfalls as snow (snow.art)}
  <div
    class="christmas-snowfall pointer-events-none absolute"
    style="z-index:{snow.layer}; animation-duration:{snow.duration}s;"
  >
    {#each [0, 1, 2] as copy (copy)}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html AMBIENT_ART[snow.art]}
    {/each}
  </div>
{/each}
