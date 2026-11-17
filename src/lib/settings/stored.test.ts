import { describe, expect, it } from "bun:test";
import {
  CLASS_DEFAULTS,
  clampArrivalMinutes,
  clampVolumeGoal,
  parseClass,
  parseRoom,
  ROOM_DEFAULTS,
  type ClassSettings,
} from "./stored";

/** Everything the app saved in one record before Classes had settings. */
const OLD_SHARED = {
  scene: "reef",
  deviceId: "usb-mic",
  calibration: { quiet: 10, talking: 60 },
  volumeGoalPreset: "custom",
  volumeGoal: 42,
  arrivalRatePreset: "lively",
  arrivalMinutes: 2,
  loudResponse: "pause",
  showMeter: true,
  showCounter: true,
};

describe("room settings", () => {
  it("defaults when nothing was saved", () => {
    expect(parseRoom(null)).toEqual(ROOM_DEFAULTS);
  });

  it("keeps the room half of the old shared record", () => {
    expect(parseRoom(OLD_SHARED)).toEqual({
      deviceId: "usb-mic",
      calibration: { quiet: 10, talking: 60 },
      showMeter: true,
      showCounter: true,
    });
  });

  it("ignores values of the wrong kind", () => {
    expect(parseRoom({ deviceId: 3, showMeter: "yes" })).toEqual(ROOM_DEFAULTS);
  });
});

describe("class settings", () => {
  it("defaults when neither the Class nor the old record has any", () => {
    expect(parseClass(null, null)).toEqual(CLASS_DEFAULTS);
  });

  it("inherits the old shared choices until the Class saves its own", () => {
    expect(parseClass(null, OLD_SHARED)).toEqual({
      scene: "reef",
      volumeGoalPreset: "custom",
      volumeGoal: 42,
      arrivalRatePreset: "lively",
      arrivalMinutes: 2,
      loudResponse: "pause",
    });
  });

  it("prefers the Class's own record over the old one", () => {
    const own: ClassSettings = {
      ...CLASS_DEFAULTS,
      volumeGoal: 15,
      scene: "arctic",
    };
    expect(parseClass(own, OLD_SHARED)).toEqual(own);
  });

  it("carries a preset's minutes over from before minutes were saved", () => {
    expect(parseClass({ arrivalRatePreset: "relaxed" }).arrivalMinutes).toBe(8);
  });

  it("drops a Scene this version doesn't have", () => {
    expect(parseClass({ scene: "moon" }).scene).toBe(CLASS_DEFAULTS.scene);
  });
});

describe("clamping", () => {
  it("snaps a goal to the matching preset", () => {
    expect(clampVolumeGoal(30)).toEqual({
      volumeGoal: 30,
      volumeGoalPreset: "independent",
    });
    expect(clampVolumeGoal(150)).toEqual({
      volumeGoal: 99,
      volumeGoalPreset: "custom",
    });
  });

  it("keeps typed minutes within bounds", () => {
    expect(clampArrivalMinutes(0)).toEqual({
      arrivalMinutes: 1,
      arrivalRatePreset: "custom",
    });
    expect(clampArrivalMinutes(5)).toEqual({
      arrivalMinutes: 5,
      arrivalRatePreset: "normal",
    });
  });
});
