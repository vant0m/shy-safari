/**
 * Recording each Class's statistics, on this computer only.
 *
 * The loop reports every frame of judged listening (`observe`), the Session
 * reports arrivals and Creatures that Run Away, and the App reports each
 * Start. All of it gathers in memory and is written to the Class's
 * `stats` key every half-minute, when the tab is hidden or closed, and before
 * the Class on screen changes — never on every frame
 * (docs/adr/0014-class-statistics.md).
 */

import { browser } from "$app/environment";
import { classes } from "$lib/classes/classes.svelte";
import type { RarityTier } from "$lib/scenes/types";
import {
  commit,
  countArrival,
  dayOf,
  emptyPending,
  emptyStats,
  parseStats,
  slotOf,
  type ClassStats,
  type Pending,
} from "./statsData";

const PART = "stats";
const FLUSH_MS = 30_000;
/** One level sample per second of listening is plenty for ten-minute slots. */
const SAMPLE_MS = 1000;
/**
 * A frame longer than this means frames stopped (a hidden tab, a sleeping
 * laptop): the gap was not listened to, so it is not counted.
 */
const MAX_FRAME_MS = 2000;

function read(key: string): ClassStats {
  if (!browser) return emptyStats();
  try {
    return parseStats(JSON.parse(localStorage.getItem(key) ?? "null"));
  } catch {
    return emptyStats();
  }
}

class Stats {
  #saved = $state<ClassStats>(read(classes.storageKey(PART)));
  #pending: Pending = emptyPending();
  #dirty = false;
  #lastFlush = 0;
  #sinceSample = 0;
  #levelSum = 0;
  #levelCount = 0;
  /** Set just before an import replaces everything, so nothing is written. */
  #frozen = false;

  /** The Class on screen's statistics, as of the last write. */
  get current(): ClassStats {
    return this.#saved;
  }

  /**
   * Any Class's statistics as last written. Call `flush` first (not from a
   * `$derived`) for the one on screen to include what is pending.
   */
  of(classId: string): ClassStats {
    if (classId === classes.currentId) return this.#saved;
    return read(classes.storageKeyFor(classId, PART));
  }

  /** A frame of judged listening while the Session runs. */
  observe(deltaMs: number, quiet: boolean, level: number, now = Date.now()) {
    if (deltaMs <= 0 || deltaMs > MAX_FRAME_MS) return;
    if (quiet) this.#pending.quietMs += deltaMs;
    else this.#pending.loudMs += deltaMs;
    this.#levelSum += level * deltaMs;
    this.#levelCount += deltaMs;
    this.#sinceSample += deltaMs;
    if (this.#sinceSample >= SAMPLE_MS) {
      const slot = slotOf(new Date(now));
      const mean = this.#levelSum / this.#levelCount;
      const [sum, count] = this.#pending.level[slot] ?? [0, 0];
      this.#pending.level[slot] = [sum + mean, count + 1];
      this.#sinceSample = 0;
      this.#levelSum = 0;
      this.#levelCount = 0;
    }
    this.#dirty = true;
    if (now - this.#lastFlush >= FLUSH_MS) this.flush(now);
  }

  sessionStarted() {
    this.#pending.sessions += 1;
    this.#dirty = true;
  }

  arrived(tier: RarityTier) {
    countArrival(this.#pending, tier);
    this.#dirty = true;
  }

  fled(count: number) {
    this.#pending.departures += count;
    this.#dirty = true;
  }

  /** Write down what is pending for the Class on screen. */
  flush(now = Date.now()) {
    this.#lastFlush = now;
    if (!this.#dirty || this.#frozen) return;
    this.#saved = commit(this.#saved, dayOf(new Date(now)), this.#pending);
    this.#pending = emptyPending();
    this.#dirty = false;
    if (!browser) return;
    try {
      localStorage.setItem(
        classes.storageKey(PART),
        JSON.stringify(this.#saved),
      );
    } catch {
      // Browsing privately, or storage full: the panel still shows this visit.
    }
  }

  /** Switch to the Class now on screen. Flush before the switch. */
  reload() {
    this.#pending = emptyPending();
    this.#dirty = false;
    this.#saved = read(classes.storageKey(PART));
  }

  /** Forget a Class's statistics, keeping everything else it has. */
  clear(classId: string) {
    if (classId === classes.currentId) {
      this.#pending = emptyPending();
      this.#dirty = false;
      this.#saved = emptyStats();
    }
    if (!browser) return;
    try {
      localStorage.removeItem(classes.storageKeyFor(classId, PART));
    } catch {
      // Nothing was saved.
    }
  }

  /** Stop writing, for good: an import is about to replace everything. */
  freeze() {
    this.#frozen = true;
  }
}

export const stats = new Stats();
