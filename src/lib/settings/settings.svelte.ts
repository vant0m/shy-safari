/**
 * Everything the teacher chooses, remembered on this computer.
 *
 * Kept in localStorage, like everything else; a copy with sync turned on
 * also saves it to the school's server (docs/adr/0015-sync-through-cloudflare.md).
 * The animals each Scene has earned are kept separately
 * (`session/savedReef.ts`) and only until Reset.
 *
 * Room settings (the microphone, its calibration, what stays up on screen)
 * are shared; Class settings (the Volume Goal, the Arrival Rate, what Too Loud
 * does and the Scene) belong to the Class on screen. See `stored.ts` and
 * docs/adr/0010-settings-per-class.md.
 */

import { browser } from "$app/environment";
import type { Calibration } from "$lib/audio/calibration";
import { classes } from "$lib/classes/classes.svelte";
import type { SceneId } from "$lib/scenes/types";
import {
  ARRIVAL_RATE_PRESETS,
  CLASS_DEFAULTS,
  clampArrivalMinutes,
  clampVolumeGoal,
  parseClass,
  parseRoom,
  ROOM_DEFAULTS,
  VOLUME_GOAL_PRESETS,
  type ArrivalRatePreset,
  type ClassSettings,
  type LoudResponse,
  type RoomSettings,
  type VolumeGoalPreset,
} from "./stored";

export {
  ARRIVAL_RATE_PRESETS,
  MAX_ARRIVAL_MINUTES,
  MIN_ARRIVAL_MINUTES,
  VOLUME_GOAL_PRESETS,
  type ArrivalRatePreset,
  type LoudResponse,
  type VolumeGoalPreset,
} from "./stored";

/**
 * The room's settings. Before Classes had settings of their own this record
 * held every setting, so it may still carry the old shared Class settings:
 * they are left in place for any Class that has yet to save its own.
 */
const ROOM_KEY = "class-noise-level:settings";
/** What each Class keeps its settings under (`classes.storageKey`). */
export const CLASS_SETTINGS_PART = "settings";

function readJson(key: string): unknown {
  if (!browser) return null;
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (!browser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A teacher browsing privately still gets a working app, just a
    // forgetful one. Losing settings is not worth breaking the Session for.
  }
}

function readClass(legacy: unknown): ClassSettings {
  if (!browser) return { ...CLASS_DEFAULTS };
  return parseClass(readJson(classes.storageKey(CLASS_SETTINGS_PART)), legacy);
}

class Settings {
  /** The room record as saved, old shared Class settings and all. */
  #legacy: unknown = readJson(ROOM_KEY);
  #room = $state<RoomSettings>(
    browser ? parseRoom(this.#legacy) : { ...ROOM_DEFAULTS },
  );
  #class = $state<ClassSettings>(readClass(this.#legacy));

  /** Switch to the Class now on screen's settings. */
  reload() {
    this.#class = readClass(this.#legacy);
  }

  /**
   * Give a newly added Class the settings of the one on screen, so a teacher
   * who has tuned the goal for this room doesn't start from scratch.
   */
  copyTo(classId: string) {
    writeJson(
      classes.storageKeyFor(classId, CLASS_SETTINGS_PART),
      $state.snapshot(this.#class),
    );
  }

  #setRoom(change: Partial<RoomSettings>) {
    this.#room = { ...this.#room, ...change };
    const legacy =
      this.#legacy && typeof this.#legacy === "object" ? this.#legacy : {};
    writeJson(ROOM_KEY, { ...legacy, ...this.#room });
  }

  #setClass(change: Partial<ClassSettings>) {
    this.#class = { ...this.#class, ...change };
    writeJson(classes.storageKey(CLASS_SETTINGS_PART), this.#class);
  }

  get scene() {
    return this.#class.scene;
  }

  set scene(value: SceneId) {
    if (value === this.#class.scene) return;
    this.#setClass({ scene: value });
  }

  get deviceId() {
    return this.#room.deviceId;
  }

  set deviceId(value: string) {
    if (value === this.#room.deviceId) return;
    // A calibration belongs to the microphone it was measured on, so
    // switching device throws it away rather than silently misreading.
    this.#setRoom({ deviceId: value, calibration: null });
  }

  get calibration() {
    return this.#room.calibration;
  }

  set calibration(value: Calibration | null) {
    this.#setRoom({ calibration: value });
  }

  get volumeGoal() {
    return this.#class.volumeGoal;
  }

  get volumeGoalPreset() {
    return this.#class.volumeGoalPreset;
  }

  useVolumeGoalPreset(preset: Exclude<VolumeGoalPreset, "custom">) {
    this.#setClass({
      volumeGoalPreset: preset,
      volumeGoal: VOLUME_GOAL_PRESETS[preset].goal,
    });
  }

  setVolumeGoal(goal: number) {
    this.#setClass(clampVolumeGoal(goal));
  }

  get arrivalRatePreset() {
    return this.#class.arrivalRatePreset;
  }

  get arrivalMinutes() {
    return this.#class.arrivalMinutes;
  }

  useArrivalRatePreset(preset: Exclude<ArrivalRatePreset, "custom">) {
    this.#setClass({
      arrivalRatePreset: preset,
      arrivalMinutes: ARRIVAL_RATE_PRESETS[preset].minutes,
    });
  }

  setArrivalMinutes(minutes: number) {
    if (!Number.isFinite(minutes)) return;
    this.#setClass(clampArrivalMinutes(minutes));
  }

  get loudResponse() {
    return this.#class.loudResponse;
  }

  set loudResponse(value: LoudResponse) {
    this.#setClass({ loudResponse: value });
  }

  get showMeter() {
    return this.#room.showMeter;
  }

  set showMeter(value: boolean) {
    this.#setRoom({ showMeter: value });
  }

  get showCounter() {
    return this.#room.showCounter;
  }

  set showCounter(value: boolean) {
    this.#setRoom({ showCounter: value });
  }

  get arrivalIntervalMs() {
    return this.#class.arrivalMinutes * 60_000;
  }
}

export const settings = new Settings();
