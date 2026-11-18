/**
 * The debug menu's state, for trying the app out on a developer's computer
 * (`bun run dev`) without a microphone, without waiting for the calendar and
 * without waiting minutes for each arrival. See `components/DebugPanel.svelte`
 * and docs/running-locally.md.
 *
 * Development only: `enabled` is `import.meta.env.DEV`, which Vite replaces
 * with a constant at build time, so in a production build every check below
 * is `false`, the panel is left out of the bundle (`routes/+page.svelte`)
 * and nothing here can change what a class sees in the hosted app.
 *
 * Kept in this browser's localStorage under its own key, outside the app's
 * `class-noise-level:` prefix, so it is never exported, imported or synced.
 */

import { browser } from "$app/environment";
import { isDay } from "$lib/scenes/limited/calendar";

const KEY = "shy-safari-debug";

/** How much faster than real time the arrival clock runs. */
export const SPEEDS = [1, 10, 60] as const;
export type Speed = (typeof SPEEDS)[number];

interface Saved {
  fakeMic: boolean;
  level: number;
  day: string | null;
  speed: Speed;
}

const DEFAULTS: Saved = { fakeMic: false, level: 0, day: null, speed: 1 };

function load(): Saved {
  if (!import.meta.env.DEV || !browser) return DEFAULTS;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (!saved || typeof saved !== "object") return DEFAULTS;
    return {
      fakeMic: saved.fakeMic === true,
      level:
        typeof saved.level === "number"
          ? Math.min(100, Math.max(0, saved.level))
          : 0,
      day: typeof saved.day === "string" && isDay(saved.day) ? saved.day : null,
      speed: SPEEDS.includes(saved.speed) ? saved.speed : 1,
    };
  } catch {
    return DEFAULTS;
  }
}

class Debug {
  /** Whether the debug menu exists at all: only under `bun run dev`. */
  readonly enabled: boolean = import.meta.env.DEV;
  /** Stand in for the microphone: no permission prompt, level set by hand. */
  fakeMic = $state(DEFAULTS.fakeMic);
  /** The fake microphone's level, 0-100, as a real one would publish it. */
  level = $state(DEFAULTS.level);
  /** Pretend it is this day (`YYYY-MM-DD`), or null for the real date. */
  day = $state<string | null>(DEFAULTS.day);
  /** Arrival clock multiplier. */
  speed = $state<Speed>(DEFAULTS.speed);

  constructor() {
    const saved = load();
    this.fakeMic = saved.fakeMic;
    this.level = saved.level;
    this.day = saved.day;
    this.speed = saved.speed;
  }

  /** Whether the microphone should be faked right now. */
  get micIsFake(): boolean {
    return this.enabled && this.fakeMic;
  }

  /** The day to pretend it is, or null to use the real date. */
  get dayOverride(): string | null {
    return this.enabled ? this.day : null;
  }

  /** How much to speed the arrival clock up by: always 1 outside dev. */
  get timeScale(): number {
    return this.enabled ? this.speed : 1;
  }

  save() {
    if (!this.enabled || !browser) return;
    try {
      const saved: Saved = {
        fakeMic: this.fakeMic,
        level: this.level,
        day: this.day,
        speed: this.speed,
      };
      localStorage.setItem(KEY, JSON.stringify(saved));
    } catch {
      // Private browsing: the menu still works until a refresh.
    }
  }
}

export const debug = new Debug();
