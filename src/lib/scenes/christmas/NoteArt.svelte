<script lang="ts">
  /**
   * A Note at the Christmas chalet: a painted board in a wooden frame,
   * hanging from above on two red ribbons, with snow lying along its
   * top and a sprig of holly on its corner. The same board as the reef's
   * (`scenes/noteArt.ts`), so the words sit on one plain, pale surface that
   * reads from the back of the room; the snow and the holly stay on the frame.
   */

  import { signShape } from "$lib/scenes/noteArt";

  let { width, height }: { width: number; height: number } = $props();

  const shape = $derived(signShape(width, height));
  // Inlined into the page, possibly more than once: ids must not clash.
  const uid = $props.id();
  const boardId = `note-board-${uid}`;

  /** Tall enough to run up past the top of any screen. */
  const RIBBON_REACH = 4000;

  /** Snow along the top bar: a soft heap, thickest in the middle. */
  const snow = $derived.by(() => {
    const { x, y, width: w } = shape.frame;
    const depth = Math.max(5, (shape.frame.height - shape.panel.height) * 0.4);
    return [
      `M ${x - depth * 0.2} ${y + depth * 0.5}`,
      `C ${x} ${y - depth * 0.6}, ${x + w * 0.3} ${y - depth * 1.1}, ${x + w * 0.5} ${y - depth * 0.9}`,
      `C ${x + w * 0.7} ${y - depth * 1.1}, ${x + w} ${y - depth * 0.6}, ${x + w + depth * 0.2} ${y + depth * 0.5}`,
      `C ${x + w * 0.8} ${y + depth * 0.9}, ${x + w * 0.2} ${y + depth * 0.9}, ${x - depth * 0.2} ${y + depth * 0.5}`,
      "Z",
    ].join(" ");
  });

  const LEAF =
    "M0 0 C 8 -10, 22 -12, 34 -6 C 30 -2, 32 4, 28 6 C 24 4, 20 8, 16 12 C 12 8, 6 10, 4 6 C 6 2, 2 2, 0 0 Z";
</script>

<!-- The ribbons, on their own behind every Note (`.note-behind`), so a sign
     lower down never hangs its ribbons across the one above it. -->
<svg class="note-behind" viewBox="0 0 {width} {height}" aria-hidden="true">
  {#each shape.ropes as rope, i (i)}
    <rect
      x={rope.x - rope.width * 0.75}
      y={-RIBBON_REACH}
      width={rope.width * 1.5}
      height={RIBBON_REACH + rope.y}
      fill="#d62839"
    />
  {/each}
</svg>

<svg viewBox="0 0 {width} {height}" aria-hidden="true">
  <defs>
    <clipPath id={boardId}>
      <rect
        x={shape.panel.x}
        y={shape.panel.y}
        width={shape.panel.width}
        height={shape.panel.height}
        rx={shape.panel.rx}
      />
    </clipPath>
  </defs>

  <rect
    x={shape.frame.x}
    y={shape.frame.y}
    width={shape.frame.width}
    height={shape.frame.height}
    rx={shape.frame.rx}
    fill="#8a5a3b"
  />
  {#each shape.grain as grain, i (i)}
    <path
      d={grain}
      fill="none"
      stroke="#2b2b3a"
      stroke-opacity="0.22"
      stroke-width={shape.grainWidth}
      stroke-linecap="round"
    />
  {/each}

  <!-- The board: one plain, pale surface, with nothing to cross the words. -->
  <rect
    x={shape.panel.x}
    y={shape.panel.y}
    width={shape.panel.width}
    height={shape.panel.height}
    rx={shape.panel.rx}
    fill="#f7efe0"
  />
  <rect
    x={shape.panel.x}
    y={shape.panel.y}
    width={shape.panel.width}
    height={(shape.frame.height - shape.panel.height) * 0.14}
    fill="#2b2b3a"
    opacity="0.1"
    clip-path="url(#{boardId})"
  />

  {#each shape.nails as nail, i (i)}
    <circle
      cx={nail.cx}
      cy={nail.cy}
      r={nail.r}
      fill="#2b2b3a"
      opacity="0.45"
    />
  {/each}

  <path d={snow} fill="#f4f7fc" />

  <!-- The ribbons' bows, tied round the top of the frame. -->
  {#each shape.ropes as rope, i (i)}
    <g transform="translate({rope.x} {rope.y})">
      <path
        d="M0 0 C {-rope.width * 3} {-rope.width * 2.2}, {-rope.width *
          3.4} {rope.width * 1.8}, 0 0 C {rope.width * 3} {-rope.width *
          2.2}, {rope.width * 3.4} {rope.width * 1.8}, 0 0 Z"
        fill="#d62839"
      />
      <circle r={rope.width * 0.7} fill="#a81d2c" />
    </g>
  {/each}

  <!-- Holly, where the reef's starfish clings. -->
  <g
    transform="translate({shape.starfish.x} {shape.starfish.y}) scale({shape
      .starfish.size / 60})"
  >
    <path d={LEAF} fill="#2e8b57" transform="translate(-2 0) rotate(200)" />
    <path d={LEAF} fill="#246b45" transform="translate(2 2) rotate(-20)" />
    <circle cx="-3" cy="-4" r="6" fill="#d62839" />
    <circle cx="6" cy="-2" r="6" fill="#d62839" />
    <circle cx="1" cy="5" r="6" fill="#d62839" />
    <circle cx="-4.5" cy="-6" r="1.8" fill="#ffffff" opacity="0.6" />
  </g>
</svg>
