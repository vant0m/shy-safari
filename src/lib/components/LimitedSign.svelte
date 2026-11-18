<script lang="ts">
  /**
   * A small wooden plaque in a limited-time Scene (nailed to the oak in
   * Pumpkin Hollow, hung from the garland at Christmas), for the class to read:
   * on the day a Newcomer unlocks, that someone new is about (until the class
   * has spotted it), and after the big day how many days the Scene has left.
   * It says nothing on other days.
   *
   * Part of the world, like a Note: Creatures pass behind it and Too Loud
   * clouds it with the rest of the Scene. It never moves faster than a slow
   * fade, since it is up on a projector all day.
   */

  import { t } from "$lib/i18n/index.svelte";
  import {
    daysLeft,
    phase,
    todaysNewcomer,
  } from "$lib/scenes/limited/calendar";
  import type { LimitedConfig } from "$lib/scenes/limited/registry";
  import type { SceneId } from "$lib/scenes/types";
  import { sightings } from "$lib/session/sightings.svelte";
  import { today } from "$lib/today.svelte";
  import { fade } from "svelte/transition";

  let { sceneId, limited }: { sceneId: SceneId; limited: LimitedConfig } =
    $props();

  const message = $derived.by(() => {
    const day = today.day;
    const now = phase(limited.calendar, day);
    if (now === "countdown") {
      const days = daysLeft(limited.calendar, day!);
      return days === 1
        ? t(limited.sign.lastDay)
        : t(limited.sign.closesIn, { days });
    }
    if (now !== "unlocking") return null;
    const newcomer = todaysNewcomer(limited.calendar, day);
    if (!newcomer || sightings.count(sceneId, newcomer) > 0) return null;
    return t(limited.sign.newToday);
  });
</script>

{#if message}
  <div
    class="hollow-sign sign-{sceneId} pointer-events-none absolute"
    role="status"
    transition:fade={{ duration: 1200 }}
  >
    <span class="hollow-sign-nail left"></span>
    <span class="hollow-sign-nail right"></span>
    {message}
  </div>
{/if}

<style>
  .hollow-sign {
    /* On the oak's trunk, at the left, above the bough. Over the Creatures
       (whose layers run up to 1500) and under the Too Loud veil (2000). */
    left: 2.5%;
    top: 30%;
    z-index: 1900;
    max-width: min(18rem, 22%);
    padding: 0.7em 1.1em;
    transform: rotate(-2.5deg);
    border: 0.3em solid #4a3426;
    border-radius: 0.5em;
    background: #6b4f3a;
    color: #f4f1de;
    font-size: clamp(0.8rem, 1.15vw, 1.35rem);
    font-weight: 600;
    line-height: 1.3;
    text-align: center;
    box-shadow: 0 0.25em 0 #2b2b3a40;
  }

  /* At Christmas: hung from the garland at the left, above the chalet,
     clear of the clearing where everyone walks. */
  .sign-christmas {
    left: 2.5%;
    top: 20%;
    transform: rotate(1.5deg);
    border-color: #5a3a24;
    background: #7a4a2c;
    box-shadow:
      0 -0.35em 0 #f4f7fb,
      0 0.25em 0 #2b2b3a40;
  }

  .hollow-sign-nail {
    position: absolute;
    top: 0.35em;
    width: 0.4em;
    height: 0.4em;
    border-radius: 50%;
    background: #c3ccd6;
  }

  .left {
    left: 0.45em;
  }

  .right {
    right: 0.45em;
  }
</style>
