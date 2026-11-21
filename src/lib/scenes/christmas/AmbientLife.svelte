<script lang="ts">
  /**
   * Scenery that is alive but is not a Creature, for a Christmas village at
   * night: the northern lights, chalets with glowing windows and smoke from
   * the chimney, lit fir trees framing the edges, the Christmas tree that
   * Father Christmas lights, a lamp post, a lit fence, snow falling (fine
   * behind the Creatures, big flakes in front) and a few twinkling stars.
   * Present from the first second of every Session, never earned, never
   * counted.
   *
   * The far things are the backdrop (`ambient/backdrop.svg`); everything
   * standing on the snow is placed here, as on the savanna
   * (`savanna/AmbientLife.svelte`), layered by where it meets the ground so a
   * Creature passes in front of some of it and behind the rest. Lights are
   * classes inside the inlined artwork (`christmas-window`, `christmas-bulb`,
   * `christmas-tree-light`…), so `scene.css` can put them out for Too Loud
   * and `entrance.css` can light the tree. Sizes follow the one scale every
   * Scene shares: a door is a little taller than a person standing at its
   * depth. Positions are fixed, so the Scene looks the same each time.
   */

  import { groundLayer } from "$lib/scenes/motion";
  import { AMBIENT_ART } from "$lib/scenes/christmas/artwork";

  /**
   * Everything standing on the snow. `x` is the left edge and `size` the
   * width, in hundredths of the world's width; `base` is how far up from the
   * bottom of the Scene it stands (the snowfield runs from about 37% at the
   * back to the bottom edge). `smoke` marks the chimney, as fractions of the
   * piece's own box.
   */
  const ground: {
    x: number;
    base: number;
    size: number;
    art: string;
    smoke?: { x: number; y: number };
  }[] = [
    // The back of the snowfield.
    { x: 3, base: 35, size: 4, art: "fir-snow" },
    { x: 13, base: 34, size: 13, art: "chalet-small" },
    { x: 29, base: 35, size: 3.5, art: "fir-snow" },
    { x: 44, base: 36, size: 3, art: "fir-snow" },
    { x: 60, base: 35, size: 3.5, art: "fir-snow" },
    { x: 89, base: 35, size: 4, art: "fir-snow" },
    // The middle.
    { x: 31, base: 22, size: 7, art: "drift" },
    { x: 55, base: 24, size: 6, art: "xmas-tree" },
    {
      x: 63,
      base: 21,
      size: 25,
      art: "chalet-big",
      smoke: { x: 0.78, y: 0.11 },
    },
    { x: 8, base: 17, size: 5, art: "fir-snow" },
    // The front.
    { x: 19, base: 4, size: 3.2, art: "lamp" },
    { x: 46, base: 3, size: 9, art: "drift" },
    { x: 72, base: 1, size: 30, art: "fence" },
    { x: -7, base: -2, size: 15, art: "fir-lit" },
    { x: 91, base: -1, size: 13, art: "fir-lit" },
  ];

  const pieces = ground
    .map((piece) => ({ ...piece, layer: groundLayer(1 - piece.base / 100) }))
    .sort((a, b) => a.layer - b.layer);

  /** The northern lights' two curtains, shimmering out of step. */
  const curtains = [
    { art: "aurora-2", top: 0, height: 30, duration: 19, delay: -7 },
    { art: "aurora-1", top: 3, height: 36, duration: 14, delay: 0 },
  ];

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

  /** Stars that twinkle, as % of the world's width and the Scene's height. */
  const stars = [
    { x: 9, y: 8, delay: 0 },
    { x: 27, y: 14, delay: -2.2 },
    { x: 46, y: 6, delay: -4.1 },
    { x: 63, y: 12, delay: -1.3 },
    { x: 80, y: 5, delay: -3.4 },
    { x: 94, y: 15, delay: -5.2 },
  ];
</script>

{#each curtains as curtain (curtain.art)}
  <div
    class="christmas-aurora pointer-events-none absolute"
    style="top:{curtain.top}%; height:{curtain.height}%;"
  >
    <div
      class="christmas-aurora-sway"
      style="animation-duration:{curtain.duration}s; animation-delay:{curtain.delay}s;"
    >
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html AMBIENT_ART[curtain.art]}
    </div>
  </div>
{/each}

{#each stars as star (star.x)}
  <div
    class="christmas-star-twinkle pointer-events-none absolute"
    style="left:calc(var(--world-left) + {star.x} * var(--wu)); top:{star.y}%; animation-delay:{star.delay}s;"
  ></div>
{/each}

{#each pieces as piece (`${piece.art}:${piece.x}:${piece.base}`)}
  <div
    class="christmas-piece pointer-events-none absolute"
    style="left:calc(var(--world-left) + {piece.x} * var(--wu)); bottom:{piece.base}%; width:calc({piece.size} * var(--wu)); z-index:{piece.layer};"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html AMBIENT_ART[piece.art]}
    {#if piece.smoke}
      <div
        class="christmas-smoke"
        style="left:{piece.smoke.x * 100}%; top:{piece.smoke.y * 100}%;"
      >
        {#each puffs as delay (delay)}
          <div class="christmas-puff" style="animation-delay:{delay}s;">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html AMBIENT_ART.smoke}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/each}

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
