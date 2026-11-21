<script lang="ts" module>
  /** How long the whole ride lasts, fades included. */
  export const RIDE_MS = 13_000;
  /** With reduced motion: a short, still crossfade instead. */
  export const STILL_MS = 4_000;
</script>

<script lang="ts">
  /**
   * Father Christmas's sleigh ride: the celebration when Rudolph, Father
   * Christmas and the sleigh have come together and formed the Legendary
   * (`session/combos.ts`, docs/adr/0016-christmas-chalet.md).
   *
   * The village fades away to the starry sky and the falling snow; the
   * sleigh, pulled by Rudolph, sweeps in from the front, loops twice and
   * flies off small towards the mountains, leaving a trail of golden light
   * that sparkles and fades; then the village comes back with the Legendary
   * up in the sky. Slow fades only, never a flash: it is up on a projector,
   * in front of photosensitive students. With reduced motion it is a short
   * crossfade with the sleigh holding still.
   *
   * While it plays the room is not judged (`App.suspendJudging`), so nobody's
   * cheering can make the village go dark.
   */

  import { onMount } from "svelte";
  import { AMBIENT_ART, CREATURE_ART } from "$lib/scenes/christmas/artwork";

  let { onstart, onend }: { onstart: (ms: number) => void; onend: () => void } =
    $props();

  /** The flight, in the 1920 by 1080 Scene: in from the front left, two loops, off small. */
  const PATH =
    "M -300 920 C 200 790, 520 560, 800 600 C 1060 640, 1060 380, 880 370 C 700 360, 700 560, 900 560 C 1120 560, 1240 380, 1420 360 C 1600 340, 1620 480, 1500 500 C 1380 520, 1360 400, 1460 390 C 1520 385, 1560 410, 1620 440";
  /** When the flight starts and how long it lasts, in seconds. */
  const FLY_FROM = 1.5;
  const FLY_FOR = 9;

  const still =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const duration = still ? STILL_MS : RIDE_MS;

  /** The Legendary's own drawing, re-rooted to sit centred on the flight. */
  const art = CREATURE_ART["santa-sleigh"].replace(
    /<svg[^>]*>/,
    '<svg x="-210" y="-95" width="420" height="190" viewBox="0 -4 420 190" overflow="visible">',
  );

  let trail: SVGPathElement | undefined = $state();
  let sparkles = $state<{ x: number; y: number; delay: number }[]>([]);

  onMount(() => {
    onstart(duration);
    if (!still && trail) {
      const length = trail.getTotalLength();
      sparkles = Array.from({ length: 28 }, (_, i) => {
        const t = (i + 0.5) / 28;
        const point = trail!.getPointAtLength(t * length);
        return { x: point.x, y: point.y, delay: FLY_FROM + t * FLY_FOR };
      });
    }
    const done = setTimeout(onend, duration);
    return () => clearTimeout(done);
  });
</script>

<div
  class="sleigh-ride pointer-events-none absolute inset-0"
  class:still
  style="--ride-ms:{duration}ms;"
  aria-hidden="true"
>
  <div class="sleigh-ride-sky absolute inset-0"></div>
  {#each ["snow-fine", "snow-big"] as sheet (sheet)}
    <div
      class="christmas-snowfall sleigh-ride-snow absolute"
      style="animation-duration:{sheet === 'snow-big' ? 52 : 80}s;"
    >
      {#each [0, 1, 2] as copy (copy)}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html AMBIENT_ART[sheet]}
      {/each}
    </div>
  {/each}

  <svg
    class="absolute inset-0 size-full"
    viewBox="0 0 1920 1080"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <linearGradient id="sleigh-ride-trail" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#ffd166" stop-opacity="0.2" />
        <stop offset="0.6" stop-color="#ffd166" stop-opacity="0.9" />
        <stop offset="1" stop-color="#fff3c4" />
      </linearGradient>
    </defs>
    <!-- Far mountains, dark, where the sleigh is heading. -->
    <path
      d="M0 1080 L0 760 L120 700 L240 740 L380 640 L520 720 L660 660 L820 740 L980 690 L1120 720 L1260 620 L1400 700 L1540 640 L1700 720 L1820 680 L1920 700 L1920 1080 Z"
      fill="#14264a"
    />
    <path
      d="M380 640 L420 672 L396 668 L360 660 Z M1260 620 L1300 652 L1270 650 L1240 640 Z M1540 640 L1576 668 L1548 664 L1520 656 Z"
      fill="#b9cbe8"
      opacity="0.7"
    />

    {#if !still}
      <g class="sleigh-ride-trail">
        <path
          bind:this={trail}
          d={PATH}
          fill="none"
          stroke="#ffd166"
          stroke-opacity="0.25"
          stroke-width="26"
          stroke-linecap="round"
          pathLength="1"
          stroke-dasharray="1 1"
          stroke-dashoffset="1"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="1"
            to="0"
            begin="{FLY_FROM}s"
            dur="{FLY_FOR}s"
            fill="freeze"
          />
        </path>
        <path
          d={PATH}
          fill="none"
          stroke="url(#sleigh-ride-trail)"
          stroke-width="7"
          stroke-linecap="round"
          pathLength="1"
          stroke-dasharray="1 1"
          stroke-dashoffset="1"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="1"
            to="0"
            begin="{FLY_FROM}s"
            dur="{FLY_FOR}s"
            fill="freeze"
          />
        </path>
        {#each sparkles as sparkle, i (i)}
          <path
            class="sleigh-ride-sparkle"
            style="animation-delay:{sparkle.delay}s;"
            transform="translate({sparkle.x + ((i * 37) % 30) - 15} {sparkle.y +
              ((i * 53) % 34) -
              17})"
            d="M0 -9 L2.2 -2.2 L9 0 L2.2 2.2 L0 9 L-2.2 2.2 L-9 0 L-2.2 -2.2 Z"
            fill="#fff3c4"
          />
        {/each}
      </g>

      <g>
        <animateMotion
          path={PATH}
          begin="{FLY_FROM}s"
          dur="{FLY_FOR}s"
          rotate="auto"
          fill="freeze"
        />
        <g transform="scale(0)">
          <animateTransform
            attributeName="transform"
            type="scale"
            values="1.9;1.6;1.1;0.6;0.22"
            keyTimes="0;0.25;0.5;0.75;1"
            begin="{FLY_FROM}s"
            dur="{FLY_FOR}s"
            fill="freeze"
          />
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html art}
        </g>
      </g>
    {:else}
      <g transform="translate(960 420) scale(1.4)">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html art}
      </g>
    {/if}
  </svg>
</div>

<style>
  /* Over the whole Scene and its sign, under the Too Loud veil (which stays
     clear while the ride plays: the room is not judged). */
  .sleigh-ride {
    z-index: 1950;
    animation: sleigh-ride-fade var(--ride-ms) ease-in-out forwards;
  }

  /* In over about a second and a half, out over the last second and a half. */
  @keyframes sleigh-ride-fade {
    0% {
      opacity: 0;
    }
    11%,
    88% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  .still {
    animation-name: sleigh-ride-fade-still;
  }

  @keyframes sleigh-ride-fade-still {
    0% {
      opacity: 0;
    }
    30%,
    70% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  .sleigh-ride-sky {
    background:
      radial-gradient(1.5px 1.5px at 12% 18%, #f4f1de, transparent),
      radial-gradient(1.5px 1.5px at 27% 9%, #f4f1de, transparent),
      radial-gradient(2px 2px at 41% 24%, #f4f1de, transparent),
      radial-gradient(1.5px 1.5px at 58% 12%, #f4f1de, transparent),
      radial-gradient(2px 2px at 73% 28%, #f4f1de, transparent),
      radial-gradient(1.5px 1.5px at 86% 7%, #f4f1de, transparent),
      radial-gradient(1.5px 1.5px at 94% 33%, #f4f1de, transparent),
      radial-gradient(2px 2px at 6% 38%, #f4f1de, transparent),
      radial-gradient(1.5px 1.5px at 35% 42%, #f4f1de, transparent),
      radial-gradient(1.5px 1.5px at 65% 46%, #f4f1de, transparent),
      linear-gradient(#060c22 0%, #0f2350 55%, #1c4670 100%);
  }

  .sleigh-ride-snow {
    z-index: auto;
  }

  /* The trail of light stays a moment after the sleigh has gone, then fades. */
  .sleigh-ride-trail {
    animation: sleigh-ride-trail var(--ride-ms) linear forwards;
  }

  @keyframes sleigh-ride-trail {
    0%,
    80% {
      opacity: 1;
    }
    92%,
    100% {
      opacity: 0;
    }
  }

  /* Each sparkle swells where the sleigh has just passed, then fades: slow,
     never a flash. */
  .sleigh-ride-sparkle {
    opacity: 0;
    transform-box: fill-box;
    transform-origin: center;
    animation: sleigh-ride-sparkle 2.4s ease-in-out both;
  }

  @keyframes sleigh-ride-sparkle {
    0% {
      opacity: 0;
    }
    35% {
      opacity: 0.95;
    }
    100% {
      opacity: 0;
    }
  }
</style>
