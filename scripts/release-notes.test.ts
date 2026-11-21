import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  absoluteLinks,
  notesFor,
  REPO,
  sectionFor,
  unwrap,
} from "./release-notes";

const changelog = readFileSync(
  join(import.meta.dir, "..", "CHANGELOG.md"),
  "utf8",
);

describe("release notes", () => {
  it("takes a version's section and nothing after it", () => {
    const notes = sectionFor(changelog, "1.1.0")!;
    expect(notes).toContain("### Added");
    expect(notes).toContain("Christmas chalet");
    expect(notes).not.toContain("## [1.0.0]");
    expect(notes).not.toContain("First release maintained");
  });

  it("works for an older version too, without the link references", () => {
    const notes = sectionFor(changelog, "1.0.0")!;
    expect(notes).toContain("First release maintained");
    expect(notes).not.toContain("## [0.0.1]");
    expect(notes).not.toMatch(/^\[1\.0\.0\]: /m);
  });

  it("adds the compare link", () => {
    expect(notesFor(changelog, "1.1.0")).toContain(
      `**Full changelog:** ${REPO}/compare/v1.0.0...v1.1.0`,
    );
  });

  it("makes relative links absolute at the tag", () => {
    expect(
      absoluteLinks(
        "[ADR](docs/adr/0016.md) [x](https://a.b) [y](#z)",
        REPO,
        "v1.1.0",
      ),
    ).toBe(
      `[ADR](${REPO}/blob/v1.1.0/docs/adr/0016.md) [x](https://a.b) [y](#z)`,
    );
    expect(notesFor(changelog, "1.1.0")).not.toContain("](docs/");
  });

  it("joins hard-wrapped lines, one line per item or paragraph", () => {
    expect(
      unwrap(
        [
          "Intro that",
          "wraps.",
          "",
          "### Added",
          "",
          "- One item",
          "  that wraps.",
          "- Two",
          "  - nested",
          "    wrap",
        ].join("\n"),
      ),
    ).toBe(
      [
        "Intro that wraps.",
        "",
        "### Added",
        "",
        "- One item that wraps.",
        "- Two",
        "  - nested wrap",
      ].join("\n"),
    );
  });

  it("has nothing for a version CHANGELOG.md does not know", () => {
    expect(notesFor(changelog, "9.9.9")).toBeNull();
  });
});
