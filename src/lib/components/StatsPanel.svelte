<script lang="ts">
  /**
   * Each Class's statistics: how much of the time it stayed under the goal,
   * what arrived and what ran away, when in the day it gets loud, and how
   * the Classes compare. Read-only, teacher-facing, on this computer only
   * (docs/adr/0014-class-statistics.md).
   *
   * Every chart is a single series in one hue, drawn as SVG in the DOM, with
   * a tooltip on each mark and the numbers also in the table below.
   */

  import { classes } from "$lib/classes/classes.svelte";
  import { className, current, t } from "$lib/i18n/index.svelte";
  import { settings } from "$lib/settings/settings.svelte";
  import { stats } from "$lib/stats/stats.svelte";
  import {
    addDays,
    dayOf,
    levelByTimeOfDay,
    quietByDay,
    slotLabel,
    SLOT_MINUTES,
    totals,
    type ClassStats,
  } from "$lib/stats/statsData";

  let { onclose }: { onclose: () => void } = $props();

  type Range = "today" | "week" | "month" | "all";
  const RANGES: Range[] = ["today", "week", "month", "all"];

  let classId = $state(classes.currentId);
  let range = $state<Range>("week");
  let clearing = $state(false);
  /** Bumped after clearing, so everything below reads the store again. */
  let version = $state(0);

  const today = dayOf(new Date());

  function statsOf(id: string): ClassStats {
    void version;
    return id === classes.currentId ? stats.current : stats.of(id);
  }

  function firstDay(data: ClassStats): string {
    return Object.keys(data.days).sort()[0] ?? today;
  }

  function fromFor(data: ClassStats): string {
    if (range === "today") return today;
    if (range === "week") return addDays(today, -6);
    if (range === "month") return addDays(today, -29);
    return firstDay(data);
  }

  const data = $derived(statsOf(classId));
  const from = $derived(fromFor(data));
  const sum = $derived(totals(data, from, today));
  const days = $derived(quietByDay(data, from, today));
  const curve = $derived(levelByTimeOfDay(data, from, today));
  const goal = $derived(
    classId === classes.currentId ? settings.volumeGoal : null,
  );

  const comparison = $derived(
    classes.all.map((info) => {
      const theirs = statsOf(info.id);
      return {
        info,
        sum: totals(theirs, fromFor(theirs), today),
      };
    }),
  );

  const number = (value: number, digits = 0) =>
    value.toLocaleString(current().locale, { maximumFractionDigits: digits });

  function duration(ms: number) {
    const minutes = Math.round(ms / 60_000);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? t("stats.hm", { h, m }) : t("stats.m", { m });
  }

  const percent = (share: number | null) =>
    share === null
      ? "–"
      : share.toLocaleString(current().locale, {
          style: "percent",
          maximumFractionDigits: 0,
        });

  function shortDay(day: string) {
    const [y, m, d] = day.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(current().locale, {
      weekday: "short",
      day: "numeric",
    });
  }

  // --- Quiet minutes per day: bars ---------------------------------------
  const BAR_W = 640;
  const BAR_H = 150;
  const BAR_PAD = { top: 10, bottom: 22, left: 34, right: 6 };
  const maxQuiet = $derived(
    Math.max(10, ...days.map((entry) => entry.quietMinutes)),
  );
  const quietTicks = $derived(niceTicks(maxQuiet));

  function niceTicks(max: number): number[] {
    const step = [5, 10, 15, 30, 60, 120, 240].find((s) => max / s <= 4) ?? 480;
    const top = Math.ceil(max / step) * step;
    return Array.from({ length: top / step + 1 }, (_, i) => i * step);
  }

  const barScale = $derived(
    (BAR_H - BAR_PAD.top - BAR_PAD.bottom) / quietTicks[quietTicks.length - 1],
  );
  const slotWidth = $derived(
    (BAR_W - BAR_PAD.left - BAR_PAD.right) / Math.max(1, days.length),
  );

  /** A bar rounded only at its top, standing on the baseline. */
  function barPath(x: number, width: number, height: number) {
    const base = BAR_H - BAR_PAD.bottom;
    if (height <= 0) return "";
    const r = Math.min(4, width / 2, height);
    return `M${x} ${base}V${base - height + r}Q${x} ${base - height} ${x + r} ${base - height}H${x + width - r}Q${x + width} ${base - height} ${x + width} ${base - height + r}V${base}Z`;
  }

  // --- Noise level through the day: line ---------------------------------
  const LINE_W = 640;
  const LINE_H = 170;
  const LINE_PAD = { top: 10, bottom: 22, left: 34, right: 22 };
  const slotRange = $derived.by(() => {
    if (curve.length === 0) return { first: 0, last: 1 };
    // Whole hours round what was recorded, so the axis reads naturally.
    const perHour = 60 / SLOT_MINUTES;
    const first = Math.floor(curve[0].slot / perHour) * perHour;
    const last =
      Math.ceil((curve[curve.length - 1].slot + 1) / perHour) * perHour;
    return { first, last: Math.max(last, first + perHour) };
  });
  const xOf = (slot: number) =>
    LINE_PAD.left +
    ((slot + 0.5 - slotRange.first) / (slotRange.last - slotRange.first)) *
      (LINE_W - LINE_PAD.left - LINE_PAD.right);
  const yOf = (level: number) =>
    LINE_PAD.top +
    (1 - level / 100) * (LINE_H - LINE_PAD.top - LINE_PAD.bottom);
  /** Broken where no slot was recorded, rather than bridging the gap. */
  const linePath = $derived(
    curve
      .map(
        (point, i) =>
          `${i > 0 && point.slot === curve[i - 1].slot + 1 ? "L" : "M"}${xOf(point.slot).toFixed(1)} ${yOf(point.level).toFixed(1)}`,
      )
      .join(""),
  );
  const hourTicks = $derived.by(() => {
    const perHour = 60 / SLOT_MINUTES;
    const hours = (slotRange.last - slotRange.first) / perHour;
    const every = hours > 8 ? 2 : 1;
    const ticks: number[] = [];
    for (let s = slotRange.first; s <= slotRange.last; s += perHour * every) {
      ticks.push(s);
    }
    return ticks;
  });
  let hovered = $state<number | null>(null);

  function confirmClear() {
    stats.clear(classId);
    clearing = false;
    version += 1;
  }
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key !== "Escape") return;
    if (clearing) clearing = false;
    else onclose();
  }}
/>

<div
  class="safe-edges absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
  role="presentation"
  onclick={(event) => event.target === event.currentTarget && onclose()}
>
  <div
    class="relative flex max-h-full w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl"
    role="dialog"
    aria-modal="true"
    aria-label={t("stats.title")}
  >
    <div
      class="flex flex-wrap items-center gap-3 p-4 pr-12 pb-3 sm:p-6 sm:pr-14"
    >
      <h1 class="mr-auto text-xl font-semibold text-slate-900">
        {t("stats.title")}
      </h1>
      <label class="flex items-center gap-2 text-sm text-slate-600">
        {t("stats.class")}
        <select
          class="rounded-md border border-slate-300 px-2 py-1 text-slate-900"
          bind:value={classId}
        >
          {#each classes.all as info (info.id)}
            <option value={info.id}>{className(info.name)}</option>
          {/each}
        </select>
      </label>
      <div
        class="flex gap-1 text-sm"
        role="group"
        aria-label={t("stats.range")}
      >
        {#each RANGES as option (option)}
          <button
            class="rounded-full border px-3 py-1 whitespace-nowrap {range ===
            option
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-300 text-slate-700 hover:bg-slate-100'}"
            aria-pressed={range === option}
            onclick={() => (range = option)}
            >{t(`stats.range.${option}`)}</button
          >
        {/each}
      </div>
      <button
        class="absolute top-3 right-3 grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 sm:top-4 sm:right-4"
        aria-label={t("common.close")}
        title={t("common.close")}
        onclick={onclose}
      >
        <svg
          viewBox="0 0 24 24"
          class="size-5"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
      {#if sum.quietMs + sum.loudMs === 0 && sum.arrivals === 0}
        <p class="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          {t("stats.none")}
        </p>
      {:else}
        <dl class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {#each [[t("stats.quietTime"), duration(sum.quietMs)], [t("stats.quietShare"), percent(sum.quietShare)], [t("stats.meanLevel"), sum.meanLevel === null ? "–" : number(sum.meanLevel)], [t("stats.sessions"), number(sum.sessions)], [t("stats.arrivals"), number(sum.arrivals)], [t("stats.departures"), number(sum.departures)], [t("stats.rares"), number(sum.rares)], [t("stats.legendaries"), number(sum.legendaries)]] as [label, value] (label)}
            <div class="rounded-lg border border-slate-200 p-3">
              <dt class="text-xs text-slate-500">{label}</dt>
              <dd
                class="mt-0.5 text-xl font-semibold text-slate-900 tabular-nums"
              >
                {value}
              </dd>
            </div>
          {/each}
        </dl>

        {#if range !== "today"}
          <section class="mt-5">
            <h2 class="text-sm font-semibold text-slate-700">
              {t("stats.byDay")}
            </h2>
            <svg
              viewBox="0 0 {BAR_W} {BAR_H}"
              class="mt-2 w-full"
              role="img"
              aria-label={t("stats.byDay")}
            >
              {#each quietTicks as tick (tick)}
                {@const y = BAR_H - BAR_PAD.bottom - tick * barScale}
                <line
                  x1={BAR_PAD.left}
                  x2={BAR_W - BAR_PAD.right}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  stroke-width="1"
                />
                <text
                  x={BAR_PAD.left - 6}
                  y={y + 3.5}
                  text-anchor="end"
                  class="fill-slate-500 text-[10px] tabular-nums">{tick}</text
                >
              {/each}
              {#each days as entry, i (entry.day)}
                {@const x = BAR_PAD.left + i * slotWidth}
                {@const width = Math.max(1, slotWidth - 2)}
                <g>
                  <title
                    >{shortDay(entry.day)} · {t("stats.quietMinutes", {
                      m: number(entry.quietMinutes),
                    })}</title
                  >
                  <rect
                    {x}
                    y={BAR_PAD.top}
                    width={slotWidth}
                    height={BAR_H - BAR_PAD.top - BAR_PAD.bottom}
                    fill="transparent"
                  />
                  <path
                    d={barPath(x + 1, width, entry.quietMinutes * barScale)}
                    fill="#0d9488"
                  />
                </g>
                {#if days.length <= 10 || i % Math.ceil(days.length / 8) === 0}
                  <text
                    x={x + slotWidth / 2}
                    y={BAR_H - 6}
                    text-anchor="middle"
                    class="fill-slate-500 text-[10px]"
                    >{shortDay(entry.day)}</text
                  >
                {/if}
              {/each}
            </svg>
          </section>
        {/if}

        {#if curve.length > 0}
          <section class="mt-5">
            <h2 class="text-sm font-semibold text-slate-700">
              {t("stats.byTime")}
            </h2>
            <svg
              viewBox="0 0 {LINE_W} {LINE_H}"
              class="mt-2 w-full"
              role="img"
              aria-label={t("stats.byTime")}
              onpointerleave={() => (hovered = null)}
            >
              {#each [0, 25, 50, 75, 100] as tick (tick)}
                <line
                  x1={LINE_PAD.left}
                  x2={LINE_W - LINE_PAD.right}
                  y1={yOf(tick)}
                  y2={yOf(tick)}
                  stroke="#e2e8f0"
                  stroke-width="1"
                />
                <text
                  x={LINE_PAD.left - 6}
                  y={yOf(tick) + 3.5}
                  text-anchor="end"
                  class="fill-slate-500 text-[10px] tabular-nums">{tick}</text
                >
              {/each}
              {#each hourTicks as slot (slot)}
                <text
                  x={xOf(slot) - (xOf(1) - xOf(0)) / 2}
                  y={LINE_H - 6}
                  text-anchor="middle"
                  class="fill-slate-500 text-[10px] tabular-nums"
                  >{slotLabel(slot)}</text
                >
              {/each}
              {#if goal !== null}
                <line
                  x1={LINE_PAD.left}
                  x2={LINE_W - LINE_PAD.right}
                  y1={yOf(goal)}
                  y2={yOf(goal)}
                  stroke="#64748b"
                  stroke-width="1.5"
                  stroke-dasharray="5 4"
                />
                <text
                  x={LINE_W - LINE_PAD.right}
                  y={yOf(goal) - 4}
                  text-anchor="end"
                  class="fill-slate-600 text-[10px]"
                  >{t("stats.goal", { goal })}</text
                >
              {/if}
              <path
                d={linePath}
                fill="none"
                stroke="#0d9488"
                stroke-width="2"
                stroke-linejoin="round"
                stroke-linecap="round"
              />
              {#each curve as point (point.slot)}
                {@const x = xOf(point.slot)}
                {@const step = xOf(1) - xOf(0)}
                <g>
                  <title
                    >{slotLabel(point.slot)}–{slotLabel(point.slot + 1)} · {t(
                      "stats.level",
                    )}
                    {number(point.level)}</title
                  >
                  <rect
                    x={x - step / 2}
                    y={LINE_PAD.top}
                    width={step}
                    height={LINE_H - LINE_PAD.top - LINE_PAD.bottom}
                    fill="transparent"
                    role="presentation"
                    onpointerenter={() => (hovered = point.slot)}
                  />
                  {#if hovered === point.slot}
                    <line
                      x1={x}
                      x2={x}
                      y1={LINE_PAD.top}
                      y2={LINE_H - LINE_PAD.bottom}
                      stroke="#94a3b8"
                      stroke-width="1"
                    />
                    <circle
                      cx={x}
                      cy={yOf(point.level)}
                      r="4.5"
                      fill="#0d9488"
                      stroke="#ffffff"
                      stroke-width="2"
                    />
                    <text
                      x={Math.min(x + 6, LINE_W - 60)}
                      y={LINE_PAD.top + 10}
                      class="fill-slate-700 text-[11px] tabular-nums"
                      >{slotLabel(point.slot)} · {number(point.level)}</text
                    >
                  {/if}
                </g>
              {/each}
            </svg>
          </section>
        {/if}
      {/if}

      <section class="mt-5">
        <h2 class="text-sm font-semibold text-slate-700">
          {t("stats.compare")}
        </h2>
        <div class="mt-2 overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-xs text-slate-500">
              <tr>
                <th class="py-1 pr-3 font-medium">{t("stats.class")}</th>
                <th class="py-1 pr-3 font-medium">{t("stats.quietTime")}</th>
                <th class="py-1 pr-3 font-medium">{t("stats.quietShare")}</th>
                <th class="py-1 pr-3 font-medium">{t("stats.meanLevel")}</th>
                <th class="py-1 pr-3 font-medium">{t("stats.arrivals")}</th>
                <th class="py-1 font-medium">{t("stats.legendaries")}</th>
              </tr>
            </thead>
            <tbody>
              {#each comparison as row (row.info.id)}
                <tr
                  class="border-t border-slate-100 {row.info.id === classId
                    ? 'font-semibold text-slate-900'
                    : 'text-slate-700'}"
                >
                  <td class="py-1.5 pr-3">{className(row.info.name)}</td>
                  <td class="py-1.5 pr-3 tabular-nums"
                    >{duration(row.sum.quietMs)}</td
                  >
                  <td class="py-1.5 pr-3">
                    <div class="flex items-center gap-2">
                      <div
                        class="h-2 w-20 shrink-0 overflow-hidden rounded-full bg-slate-100"
                        aria-hidden="true"
                      >
                        <div
                          class="h-full rounded-full bg-teal-600"
                          style="width:{(row.sum.quietShare ?? 0) * 100}%"
                        ></div>
                      </div>
                      <span class="tabular-nums"
                        >{percent(row.sum.quietShare)}</span
                      >
                    </div>
                  </td>
                  <td class="py-1.5 pr-3 tabular-nums"
                    >{row.sum.meanLevel === null
                      ? "–"
                      : number(row.sum.meanLevel)}</td
                  >
                  <td class="py-1.5 pr-3 tabular-nums"
                    >{number(row.sum.arrivals)}</td
                  >
                  <td class="py-1.5 tabular-nums"
                    >{number(row.sum.legendaries)}</td
                  >
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>

      <div
        class="mt-5 flex flex-wrap items-start justify-between gap-3 border-t border-slate-200 pt-4"
      >
        <p class="max-w-md text-xs text-slate-500">{t("stats.note")}</p>
        <button
          class="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-700"
          onclick={() => (clearing = true)}>{t("stats.clear")}</button
        >
      </div>
    </div>

    {#if clearing}
      {@const name = className(
        classes.all.find((info) => info.id === classId)?.name ?? "",
      )}
      <div
        class="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-slate-900/40 p-4"
        role="presentation"
        onclick={(event) =>
          event.target === event.currentTarget && (clearing = false)}
      >
        <div
          class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="clear-stats-title"
        >
          <h2
            id="clear-stats-title"
            class="text-lg font-semibold text-slate-900"
          >
            {t("stats.clearConfirm", { name })}
          </h2>
          <div class="mt-5 flex flex-wrap justify-end gap-2">
            <button
              class="rounded-full border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
              onclick={() => (clearing = false)}>{t("common.cancel")}</button
            >
            <button
              class="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              onclick={confirmClear}>{t("stats.clearYes")}</button
            >
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
