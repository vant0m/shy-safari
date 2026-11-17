<script lang="ts">
  /**
   * The one question sync ever asks: which classes to keep, when this
   * computer and the school's server both have some and neither can be
   * kept without losing the other (docs/adr/0015-sync-through-cloudflare.md).
   * There is no "cancel": until the teacher chooses, nothing is saved.
   */

  import { t } from "$lib/i18n/index.svelte";
  import { sync, type Conflict } from "$lib/sync/sync.svelte";

  let { conflict }: { conflict: Conflict } = $props();

  const email = $derived(sync.email ?? "");
  let choosing = $state(false);

  const message = $derived(
    conflict.reason === "first-sync"
      ? t("sync.conflict.firstSync", { email })
      : conflict.reason === "both-changed"
        ? t("sync.conflict.bothChanged")
        : t("sync.conflict.otherTeacher", { email }),
  );

  const useServer = $derived(
    conflict.reason !== "other-teacher"
      ? t("sync.conflict.useServer")
      : conflict.remote === 0
        ? t("sync.conflict.startEmpty", { email })
        : t("sync.conflict.useServerOther", { email }),
  );

  const keepLocal = $derived(
    conflict.reason === "other-teacher"
      ? t("sync.conflict.keepLocalOther", { email })
      : t("sync.conflict.keepLocal"),
  );

  async function choose(choice: "server" | "local") {
    choosing = true;
    await sync.resolve(choice);
    choosing = false;
  }
</script>

<div
  class="safe-edges absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4"
  role="presentation"
>
  <div
    class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="sync-conflict-title"
    aria-describedby="sync-conflict-body"
  >
    <h2 id="sync-conflict-title" class="text-lg font-semibold text-slate-900">
      {t("sync.conflict.title")}
    </h2>
    <p id="sync-conflict-body" class="mt-2 text-sm text-slate-600">
      {message}
    </p>
    {#if conflict.reason === "other-teacher" && conflict.remote === 0}
      <p class="mt-2 text-sm text-rose-700">
        {t("sync.conflict.startEmptyWarning")}
      </p>
    {/if}
    <div class="mt-5 flex flex-col gap-2">
      <button
        class="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        disabled={choosing}
        onclick={() => choose("server")}>{useServer}</button
      >
      <button
        class="rounded-full border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
        disabled={choosing}
        onclick={() => choose("local")}>{keepLocal}</button
      >
    </div>
  </div>
</div>
