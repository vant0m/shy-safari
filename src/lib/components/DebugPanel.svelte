<script lang="ts">
  /**
   * The debug menu, for trying the app out on a developer's computer without
   * a microphone and without waiting: a pretend microphone whose level is set
   * by hand, a pretend date for the limited-time Scenes, a faster arrival
   * clock, and arrivals on demand. Only rendered under `bun run dev`
   * (`debug/debug.svelte.ts`); never part of the hosted app, so it is in
   * English only and not translated.
   */

  import type { App } from "$lib/app.svelte";
  import { debug, SPEEDS } from "$lib/debug/debug.svelte";
  import { settings } from "$lib/settings/settings.svelte";
  import { today } from "$lib/today.svelte";

  let { app }: { app: App } = $props();

  let open = $state(false);

  const DAYS = [
    { label: "Real date", day: null },
    { label: "Halloween · 30 Oct", day: "2026-10-30" },
    { label: "Advent · 1 Dec", day: "2026-12-01" },
    { label: "Father Christmas · 18 Dec", day: "2026-12-18" },
    { label: "Countdown · 28 Dec", day: "2026-12-28" },
  ];

  const goal = $derived(settings.volumeGoal);
  const levels = $derived([
    { label: "Silent", level: 0 },
    { label: "Calm", level: Math.max(0, goal - 15) },
    { label: "Too loud", level: Math.min(100, goal + 25) },
  ]);

  async function setFakeMic(on: boolean) {
    debug.fakeMic = on;
    debug.save();
    // Swap microphones at once if one is running or has failed.
    if (app.microphone.status !== "off") await app.connect();
  }

  function setLevel(level: number) {
    debug.level = level;
    debug.save();
  }

  function setDay(day: string | null) {
    debug.day = day || null;
    debug.save();
  }
</script>

<div class="pointer-events-auto fixed bottom-20 left-4 z-[60] text-sm">
  {#if open}
    <section
      class="mb-2 w-72 space-y-3 rounded-2xl bg-white/95 p-4 text-slate-800 shadow-xl"
      aria-label="Debug"
    >
      <header class="flex items-center justify-between">
        <h2 class="font-semibold">
          Debug <span class="text-xs font-normal text-slate-500"
            >(dev only)</span
          >
        </h2>
        <button
          class="rounded px-2 text-slate-500 hover:bg-slate-100"
          aria-label="Close debug"
          onclick={() => (open = false)}>×</button
        >
      </header>

      <fieldset class="space-y-2">
        <legend
          class="text-xs font-semibold tracking-wide text-slate-500 uppercase"
        >
          Microphone
        </legend>
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            checked={debug.fakeMic}
            onchange={(event) => setFakeMic(event.currentTarget.checked)}
          />
          Fake microphone (no permission)
        </label>
        {#if debug.fakeMic}
          <input
            class="w-full"
            type="range"
            min="0"
            max="100"
            value={debug.level}
            aria-label="Fake level"
            oninput={(event) => setLevel(Number(event.currentTarget.value))}
          />
          <div class="flex gap-1">
            {#each levels as preset (preset.label)}
              <button
                class="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                onclick={() => setLevel(preset.level)}>{preset.label}</button
              >
            {/each}
          </div>
        {/if}
        <p class="text-xs text-slate-500">
          Set {debug.fakeMic ? Math.round(debug.level) : "–"} · room {Math.round(
            app.monitor.level,
          )} · goal {goal} ·
          <span
            class={app.monitor.state === "quiet"
              ? "text-emerald-700"
              : "text-rose-700"}>{app.monitor.state}</span
          >
          · mic {app.microphone.status}
        </p>
      </fieldset>

      <fieldset class="space-y-2">
        <legend
          class="text-xs font-semibold tracking-wide text-slate-500 uppercase"
        >
          Date
        </legend>
        <input
          class="w-full rounded-md border border-slate-300 px-2 py-1"
          type="date"
          value={debug.day ?? ""}
          aria-label="Pretend date"
          onchange={(event) => setDay(event.currentTarget.value)}
        />
        <div class="flex flex-wrap gap-1">
          {#each DAYS as preset (preset.label)}
            <button
              class="rounded-md border px-2 py-1 text-xs hover:bg-slate-50 {debug.day ===
              preset.day
                ? 'border-slate-700'
                : 'border-slate-300'}"
              onclick={() => setDay(preset.day)}>{preset.label}</button
            >
          {/each}
        </div>
        <p class="text-xs text-slate-500">Today is {today.day ?? "…"}</p>
      </fieldset>

      <fieldset class="space-y-2">
        <legend
          class="text-xs font-semibold tracking-wide text-slate-500 uppercase"
        >
          Arrivals
        </legend>
        <div class="flex gap-1">
          {#each SPEEDS as speed (speed)}
            <button
              class="flex-1 rounded-md border px-2 py-1 text-xs hover:bg-slate-50 {debug.speed ===
              speed
                ? 'border-slate-700 font-semibold'
                : 'border-slate-300'}"
              onclick={() => {
                debug.speed = speed;
                debug.save();
              }}>{speed}×</button
            >
          {/each}
        </div>
        <div class="flex gap-1">
          <button
            class="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-40"
            disabled={!app.session.running}
            onclick={() => app.session.arriveNow(settings.arrivalIntervalMs)}
            >Arrival now</button
          >
          <button
            class="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
            onclick={() => app.session.summonAll()}>Everyone out</button
          >
        </div>
        {#if !app.session.running}
          <p class="text-xs text-slate-500">Press Start to run a Session.</p>
        {/if}
      </fieldset>

      {#if app.scene.ride}
        <fieldset class="space-y-2">
          <legend
            class="text-xs font-semibold tracking-wide text-slate-500 uppercase"
          >
            Sleigh ride
          </legend>
          <div class="flex gap-1">
            <button
              class="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
              onclick={() => app.session.summon(["rudolph", "santa", "sleigh"])}
              >The 3 Rares</button
            >
            <button
              class="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
              onclick={() =>
                (app.session.formed = {
                  slug: app.scene.ride!.slug,
                  at: Date.now(),
                })}>Replay the ride</button
            >
          </div>
          <p class="text-xs text-slate-500">
            {#if app.session.creatures.some((creature) => creature.def.slug === app.scene.ride!.slug)}
              The sleigh is already here, so the 3 Rares can't come again beside
              it. Press Reset for a new Session.
            {:else if app.session.hasCome(app.scene.ride.slug)}
              The sleigh has already formed this Session. Press Reset for a new
              Session.
            {:else}
              The 3 Rares form the Legendary and play the ride, once a Session.
            {/if}
          </p>
        </fieldset>
      {/if}
    </section>
  {/if}

  <button
    class="grid size-11 place-items-center rounded-full bg-amber-300 text-slate-900 shadow-lg hover:bg-amber-200"
    aria-label="Debug"
    title="Debug (dev only)"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    <svg
      viewBox="0 0 24 24"
      class="size-5"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect x="8" y="6" width="8" height="14" rx="4" />
      <path d="M12 20v-9M8 10H4M20 10h-4M8 15H4M20 15h-4M9 6 7 3M15 6l2-3" />
    </svg>
  </button>
</div>
