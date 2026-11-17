import { describe, expect, it } from "bun:test";
import {
  canonical,
  decide,
  isPristine,
  keyHashes,
  mergeThreeWay,
  onlyRoutineChanged,
  shortHash,
  withCurrentClass,
  withoutCurrentClass,
  type SyncMeta,
} from "./syncLogic";

const ME = "a@school.org";
const meta = (changes: Partial<SyncMeta> = {}): SyncMeta => ({
  email: ME,
  revision: 3,
  hash: "h3",
  syncedAt: "2026-11-17T08:00:00Z",
  ...changes,
});

describe("deciding what to do", () => {
  describe("on a computer never synced", () => {
    it("downloads the teacher's classes when it has none of its own", () => {
      expect(
        decide({
          email: ME,
          meta: null,
          remote: 4,
          localHash: "x",
          pristine: true,
        }),
      ).toEqual({ kind: "pull" });
    });

    it("asks when it has classes of its own and so does the server", () => {
      expect(
        decide({
          email: ME,
          meta: null,
          remote: 4,
          localHash: "x",
          pristine: false,
        }),
      ).toEqual({ kind: "ask", reason: "first-sync" });
    });

    it("uploads classes made before sync, when the server has none", () => {
      expect(
        decide({
          email: ME,
          meta: null,
          remote: 0,
          localHash: "x",
          pristine: false,
        }),
      ).toEqual({ kind: "push", base: 0 });
    });

    it("uploads nothing empty", () => {
      expect(
        decide({
          email: ME,
          meta: null,
          remote: 0,
          localHash: "x",
          pristine: true,
        }),
      ).toEqual({ kind: "adopt" });
    });
  });

  describe("on a computer last synced by another teacher", () => {
    const theirs = meta({ email: "b@school.org" });

    it("never uploads on its own", () => {
      expect(
        decide({
          email: ME,
          meta: theirs,
          remote: 0,
          localHash: "x",
          pristine: false,
        }),
      ).toEqual({ kind: "ask", reason: "other-teacher" });
      expect(
        decide({
          email: ME,
          meta: theirs,
          remote: 2,
          localHash: "x",
          pristine: false,
        }),
      ).toEqual({ kind: "ask", reason: "other-teacher" });
    });

    it("still downloads onto an empty computer", () => {
      expect(
        decide({
          email: ME,
          meta: theirs,
          remote: 2,
          localHash: "x",
          pristine: true,
        }),
      ).toEqual({ kind: "pull" });
    });
  });

  describe("on a computer synced by this teacher", () => {
    it("does nothing when neither side changed", () => {
      expect(
        decide({
          email: ME,
          meta: meta(),
          remote: 3,
          localHash: "h3",
          pristine: false,
        }),
      ).toEqual({ kind: "none" });
    });

    it("saves what changed here", () => {
      expect(
        decide({
          email: ME,
          meta: meta(),
          remote: 3,
          localHash: "h4",
          pristine: false,
        }),
      ).toEqual({ kind: "push", base: 3 });
    });

    it("downloads what changed elsewhere", () => {
      expect(
        decide({
          email: ME,
          meta: meta(),
          remote: 5,
          localHash: "h3",
          pristine: false,
        }),
      ).toEqual({ kind: "pull" });
    });

    it("asks when both changed", () => {
      expect(
        decide({
          email: ME,
          meta: meta(),
          remote: 5,
          localHash: "h4",
          pristine: false,
        }),
      ).toEqual({ kind: "ask", reason: "both-changed" });
    });

    it("puts its classes back on a server that lost them", () => {
      expect(
        decide({
          email: ME,
          meta: meta(),
          remote: 0,
          localHash: "h3",
          pristine: false,
        }),
      ).toEqual({ kind: "push", base: 0 });
    });
  });
});

describe("telling an empty computer apart", () => {
  const classes = (list: { id: string; name: string }[]) =>
    JSON.stringify({ classes: list, currentId: list[0]?.id });

  it("counts a first visit as empty", () => {
    expect(
      isPristine({
        "class-noise-level:classes": classes([{ id: "a", name: "" }]),
        "class-noise-level:settings": "{}",
        "class-noise-level:class:a:settings": "{}",
        "class-noise-level:language": "fr",
      }),
    ).toBe(true);
    expect(isPristine({})).toBe(true);
  });

  it("doesn't once there is a named class, a second class, or anything earned", () => {
    expect(
      isPristine({
        "class-noise-level:classes": classes([{ id: "a", name: "6B" }]),
      }),
    ).toBe(false);
    expect(
      isPristine({
        "class-noise-level:classes": classes([
          { id: "a", name: "" },
          { id: "b", name: "" },
        ]),
      }),
    ).toBe(false);
    for (const part of ["savanna", "sightings", "notes", "stats", "arrived"]) {
      expect(
        isPristine({
          "class-noise-level:classes": classes([{ id: "a", name: "" }]),
          [`class-noise-level:class:a:${part}`]: "[]",
        }),
      ).toBe(false);
    }
  });
});

describe("fingerprinting", () => {
  it("doesn't depend on the order keys were saved in", () => {
    expect(canonical({ b: "2", a: "1" })).toBe(canonical({ a: "1", b: "2" }));
    expect(canonical({ a: "1" })).not.toBe(canonical({ a: "2" }));
  });
});

describe("merging two computers' changes", () => {
  const base = { a: "1", b: "1", "x:c1:stats": '{"days":{}}' };
  const hashes = keyHashes(base);

  it("takes each change from the side that made it", () => {
    const result = mergeThreeWay(
      hashes,
      { ...base, a: "2" },
      { ...base, b: "3", c: "new" },
    );
    expect(result).toEqual({
      ok: true,
      data: { a: "2", b: "3", c: "new", "x:c1:stats": '{"days":{}}' },
    });
  });

  it("keeps a deletion made on one side", () => {
    const { b: _b, ...withoutB } = base;
    void _b;
    const result = mergeThreeWay(hashes, withoutB, { ...base, a: "9" });
    expect(result).toEqual({
      ok: true,
      data: { a: "9", "x:c1:stats": '{"days":{}}' },
    });
  });

  it("asks only when both changed the same thing differently", () => {
    expect(
      mergeThreeWay(hashes, { ...base, a: "2" }, { ...base, a: "3" }),
    ).toEqual({
      ok: false,
      conflicts: ["a"],
    });
    expect(
      mergeThreeWay(hashes, { ...base, a: "2" }, { ...base, a: "2" }),
    ).toEqual({
      ok: true,
      data: { ...base, a: "2" },
    });
  });

  it("combines statistics both sides recorded, day by day", () => {
    const local = JSON.stringify({
      days: {
        "2026-11-16": { quietMs: 100, sessions: 1, level: { 5: [10, 2] } },
        "2026-11-17": { quietMs: 50, sessions: 1, level: {} },
      },
    });
    const remote = JSON.stringify({
      days: {
        "2026-11-16": { quietMs: 80, sessions: 2, level: { 5: [30, 3] } },
        "2026-11-15": { quietMs: 10, sessions: 1, level: {} },
      },
    });
    const result = mergeThreeWay(
      hashes,
      { ...base, "x:c1:stats": local },
      { ...base, "x:c1:stats": remote },
    );
    expect(result.ok).toBe(true);
    const days = JSON.parse(
      (result as { data: Record<string, string> }).data["x:c1:stats"],
    ).days;
    expect(Object.keys(days).sort()).toEqual([
      "2026-11-15",
      "2026-11-16",
      "2026-11-17",
    ]);
    expect(days["2026-11-16"].quietMs).toBe(100);
    expect(days["2026-11-16"].sessions).toBe(2);
    expect(days["2026-11-16"].level["5"]).toEqual([30, 3]);
  });

  it("lets each computer keep its own Class on screen and Scene", () => {
    const list = (current: string) =>
      JSON.stringify({
        classes: [
          { id: "c1", name: "6B" },
          { id: "c2", name: "5A" },
        ],
        currentId: current,
      });
    const start = {
      "class-noise-level:classes": list("c1"),
      "class-noise-level:class:c1:settings": '{"scene":"reef"}',
    };
    const result = mergeThreeWay(
      keyHashes(start),
      {
        "class-noise-level:classes": list("c2"),
        "class-noise-level:class:c1:settings": '{"scene":"arctic"}',
      },
      {
        "class-noise-level:classes": list("c1x"),
        "class-noise-level:class:c1:settings": '{"scene":"space"}',
      },
    );
    expect(result).toEqual({
      ok: true,
      data: {
        "class-noise-level:classes": list("c2"),
        "class-noise-level:class:c1:settings": '{"scene":"arctic"}',
      },
    });
  });

  it("still asks when the class lists themselves differ", () => {
    const start = {
      "class-noise-level:classes": '{"classes":[],"currentId":"a"}',
    };
    const result = mergeThreeWay(
      keyHashes(start),
      {
        "class-noise-level:classes":
          '{"classes":[{"id":"a","name":"X"}],"currentId":"a"}',
      },
      {
        "class-noise-level:classes":
          '{"classes":[{"id":"a","name":"Y"}],"currentId":"a"}',
      },
    );
    expect(result.ok).toBe(false);
  });

  it("hashes stably", () => {
    expect(shortHash("abc")).toBe(shortHash("abc"));
    expect(shortHash("abc")).not.toBe(shortHash("abd"));
  });
});

describe("what each computer keeps to itself", () => {
  const list = JSON.stringify({
    classes: [
      { id: "c1", name: "6B" },
      { id: "c2", name: "5A" },
    ],
    currentId: "c2",
  });

  it("leaves the Class on screen out of what is synced", () => {
    const synced = withoutCurrentClass({ "class-noise-level:classes": list });
    expect(JSON.parse(synced["class-noise-level:classes"])).toEqual({
      classes: [
        { id: "c1", name: "6B" },
        { id: "c2", name: "5A" },
      ],
    });
  });

  it("puts this computer's Class back, if it still exists", () => {
    const synced = withoutCurrentClass({ "class-noise-level:classes": list });
    const back = (id: string) =>
      JSON.parse(withCurrentClass(synced, id)["class-noise-level:classes"])
        .currentId;
    expect(back("c1")).toBe("c1");
    expect(back("gone")).toBeUndefined();
  });

  it("tells routine changes from real ones", () => {
    const base = keyHashes({ "x:c1:stats": "1", "x:c1:notes": "a" });
    expect(
      onlyRoutineChanged(base, { "x:c1:stats": "2", "x:c1:notes": "a" }),
    ).toBe(true);
    expect(
      onlyRoutineChanged(base, { "x:c1:stats": "1", "x:c1:notes": "b" }),
    ).toBe(false);
  });
});
