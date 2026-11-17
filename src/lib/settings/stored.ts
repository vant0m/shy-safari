/**
 * The shape of what the teacher chooses, and how a saved copy is read back.
 * Kept free of storage and state so the rules are easy to test;
 * `settings.svelte.ts` remembers the result.
 *
 * Settings come in two halves (docs/adr/0010-settings-per-class.md):
 *
 * - **Room** settings describe the room and its hardware: the microphone, its
 *   calibration, and what the teacher keeps up on screen. They are shared by
 *   every Class.
 * - **Class** settings describe how a group works: the Volume Goal, the
 *   Arrival Rate, what Too Loud does, and the Scene they were last on. Each
 *   Class keeps its own.
 *
 * Before the split every setting lived in one shared record. A Class with no
 * settings of its own yet reads its half from that record, so updating never
 * resets anyone's choices.
 */

import type { Calibration } from "$lib/audio/calibration";
import { DEFAULT_SCENE, SCENE_IDS, type SceneId } from "$lib/scenes/types";

export type VolumeGoalPreset = "silent" | "independent" | "partner" | "custom";
export type ArrivalRatePreset = "relaxed" | "normal" | "lively" | "custom";
/**
 * What Too Loud does to the Creatures already out: hold still until the room
 * settles, or start running away. See docs/adr/0003-animals-can-run-away.md.
 */
export type LoudResponse = "flee" | "pause";

export const VOLUME_GOAL_PRESETS: Record<
  Exclude<VolumeGoalPreset, "custom">,
  { goal: number }
> = {
  silent: { goal: 15 },
  independent: { goal: 30 },
  partner: { goal: 50 },
};

export const ARRIVAL_RATE_PRESETS: Record<
  Exclude<ArrivalRatePreset, "custom">,
  { minutes: number }
> = {
  relaxed: { minutes: 8 },
  normal: { minutes: 5 },
  lively: { minutes: 2 },
};

/** Bounds on a typed-in Arrival Rate, in whole minutes. */
export const MIN_ARRIVAL_MINUTES = 1;
export const MAX_ARRIVAL_MINUTES = 60;

export interface RoomSettings {
  deviceId: string;
  calibration: Calibration | null;
  /** Keep the Noise Meter up over the Scene, not just in Settings. */
  showMeter: boolean;
  /** Keep a count of the Creatures that have arrived up over the Scene. */
  showCounter: boolean;
}

export interface ClassSettings {
  scene: SceneId;
  volumeGoalPreset: VolumeGoalPreset;
  volumeGoal: number;
  arrivalRatePreset: ArrivalRatePreset;
  arrivalMinutes: number;
  loudResponse: LoudResponse;
}

export const ROOM_DEFAULTS: RoomSettings = {
  deviceId: "",
  calibration: null,
  showMeter: false,
  showCounter: false,
};

export const CLASS_DEFAULTS: ClassSettings = {
  scene: DEFAULT_SCENE,
  volumeGoalPreset: "independent",
  volumeGoal: VOLUME_GOAL_PRESETS.independent.goal,
  arrivalRatePreset: "normal",
  arrivalMinutes: ARRIVAL_RATE_PRESETS.normal.minutes,
  loudResponse: "flee",
};

const ROOM_KEYS = Object.keys(ROOM_DEFAULTS) as (keyof RoomSettings)[];
const CLASS_KEYS = Object.keys(CLASS_DEFAULTS) as (keyof ClassSettings)[];

function asObject(saved: unknown): Record<string, unknown> {
  return saved && typeof saved === "object" && !Array.isArray(saved)
    ? (saved as Record<string, unknown>)
    : {};
}

function pick<T extends object>(
  saved: Record<string, unknown>,
  keys: (keyof T)[],
  defaults: T,
): T {
  const result = { ...defaults };
  for (const key of keys) {
    const value = saved[key as string];
    // Only a value of the right kind replaces the default: a hand-edited or
    // half-written record never puts a string where a number belongs.
    if (value !== undefined && typeof value === typeof defaults[key]) {
      result[key] = value as T[keyof T];
    }
  }
  return result;
}

/** The room half of a saved record (or of the old, shared one). */
export function parseRoom(saved: unknown): RoomSettings {
  return pick(asObject(saved), ROOM_KEYS, ROOM_DEFAULTS);
}

/**
 * A Class's half. `saved` is the Class's own record, or null if it has none
 * yet; `legacy` is the old shared record, whose choices it then inherits.
 */
export function parseClass(saved: unknown, legacy?: unknown): ClassSettings {
  const source = saved == null ? asObject(legacy) : asObject(saved);
  const stored: Record<string, unknown> = { ...source };
  // Settings saved before the rate could be typed in only have the preset;
  // carry its minutes over rather than resetting the teacher to Normal.
  if (
    typeof stored.arrivalMinutes !== "number" &&
    typeof stored.arrivalRatePreset === "string"
  ) {
    stored.arrivalMinutes =
      stored.arrivalRatePreset in ARRIVAL_RATE_PRESETS
        ? ARRIVAL_RATE_PRESETS[
            stored.arrivalRatePreset as Exclude<ArrivalRatePreset, "custom">
          ].minutes
        : CLASS_DEFAULTS.arrivalMinutes;
  }
  const result = pick(stored, CLASS_KEYS, CLASS_DEFAULTS);
  // A Scene this version no longer has falls back to the default.
  if (!SCENE_IDS.includes(result.scene)) result.scene = DEFAULT_SCENE;
  return result;
}

export function clampVolumeGoal(
  goal: number,
): Pick<ClassSettings, "volumeGoal" | "volumeGoalPreset"> {
  const clamped = Math.max(1, Math.min(99, Math.round(goal)));
  const matching = (
    Object.keys(VOLUME_GOAL_PRESETS) as Exclude<VolumeGoalPreset, "custom">[]
  ).find((preset) => VOLUME_GOAL_PRESETS[preset].goal === clamped);
  return { volumeGoal: clamped, volumeGoalPreset: matching ?? "custom" };
}

export function clampArrivalMinutes(
  minutes: number,
): Pick<ClassSettings, "arrivalMinutes" | "arrivalRatePreset"> {
  const clamped = Math.max(
    MIN_ARRIVAL_MINUTES,
    Math.min(MAX_ARRIVAL_MINUTES, Math.round(minutes)),
  );
  const matching = (
    Object.keys(ARRIVAL_RATE_PRESETS) as Exclude<ArrivalRatePreset, "custom">[]
  ).find((preset) => ARRIVAL_RATE_PRESETS[preset].minutes === clamped);
  return { arrivalMinutes: clamped, arrivalRatePreset: matching ?? "custom" };
}
