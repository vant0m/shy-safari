import { describe, expect, it } from "bun:test";
import {
  backupFileName,
  createBackup,
  parseBackup,
  restoreBackup,
  storageEntries,
  type StorageLike,
} from "./backup";

/** A Map with the Storage interface, standing in for localStorage. */
function memoryStorage(initial: Record<string, string> = {}): StorageLike & {
  dump(): Record<string, string>;
} {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    key: (index) => [...map.keys()][index] ?? null,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
    dump: () => Object.fromEntries(map),
  };
}

const CLASSES = JSON.stringify({
  classes: [{ id: "a", name: "2nd period" }],
  currentId: "a",
});

const SAVED = {
  "class-noise-level:classes": CLASSES,
  "class-noise-level:class:a:reef": "[]",
  "class-noise-level:class:a:settings": '{"volumeGoal":15}',
  "class-noise-level:settings": JSON.stringify({
    deviceId: "usb-mic",
    calibration: { quiet: 1, talking: 2 },
    showMeter: true,
  }),
  "someone-else": "not ours",
};

describe("making a backup", () => {
  it("keeps only this app's keys", () => {
    const backup = createBackup(Object.entries(SAVED));
    expect(Object.keys(backup.data)).not.toContain("someone-else");
    expect(backup.data["class-noise-level:class:a:reef"]).toBe("[]");
  });

  it("leaves out the microphone and its calibration", () => {
    const backup = createBackup(Object.entries(SAVED));
    expect(JSON.parse(backup.data["class-noise-level:settings"])).toEqual({
      showMeter: true,
    });
  });

  it("reads a Storage's entries", () => {
    expect(storageEntries(memoryStorage(SAVED))).toHaveLength(5);
  });

  it("names the file after the day", () => {
    expect(backupFileName(new Date(2026, 10, 7))).toBe(
      "shy-safari-2026-11-07.json",
    );
  });
});

describe("reading a backup", () => {
  it("round-trips", () => {
    const backup = createBackup(Object.entries(SAVED));
    const parsed = parseBackup(JSON.stringify(backup));
    expect(parsed).toEqual({ ok: true, backup });
  });

  it("refuses what isn't JSON, isn't ours, or is from a newer version", () => {
    expect(parseBackup("hello")).toEqual({ ok: false, reason: "notJson" });
    expect(parseBackup('{"app":"other","version":1,"data":{}}')).toEqual({
      ok: false,
      reason: "notBackup",
    });
    expect(parseBackup('{"app":"shy-safari","version":99,"data":{}}')).toEqual({
      ok: false,
      reason: "newerVersion",
    });
    expect(parseBackup('{"app":"shy-safari","version":1,"data":{}}')).toEqual({
      ok: false,
      reason: "empty",
    });
  });

  it("drops foreign keys and non-text values", () => {
    const parsed = parseBackup(
      JSON.stringify({
        app: "shy-safari",
        version: 1,
        data: {
          "class-noise-level:classes": CLASSES,
          "class-noise-level:class:a:reef": 42,
          evil: "x",
        },
      }),
    );
    expect(parsed.ok && Object.keys(parsed.backup.data)).toEqual([
      "class-noise-level:classes",
    ]);
  });
});

describe("restoring a backup", () => {
  it("replaces everything of ours and nothing else", () => {
    const storage = memoryStorage({
      "class-noise-level:classes": "old",
      "class-noise-level:class:z:reef": "old reef",
      "someone-else": "kept",
    });
    const backup = createBackup(
      Object.entries({ "class-noise-level:classes": CLASSES }),
    );
    restoreBackup(storage, backup);
    expect(storage.dump()).toEqual({
      "class-noise-level:classes": CLASSES,
      "someone-else": "kept",
    });
  });

  it("keeps this computer's microphone and calibration", () => {
    const storage = memoryStorage({
      "class-noise-level:settings": JSON.stringify({
        deviceId: "here",
        calibration: { quiet: 5, talking: 9 },
        showMeter: false,
      }),
    });
    restoreBackup(storage, createBackup(Object.entries(SAVED)));
    expect(JSON.parse(storage.getItem("class-noise-level:settings")!)).toEqual({
      showMeter: true,
      deviceId: "here",
      calibration: { quiet: 5, talking: 9 },
    });
  });
});
