/**
 * The notes for a GitHub Release, taken from CHANGELOG.md: the version's
 * section, with its links made absolute (a Release page does not resolve
 * paths relative to the repository) and the "Full changelog" compare link.
 * Used by .github/workflows/release.yml.
 *
 * usage: bun scripts/release-notes.ts 1.1.0 [repoUrl] > notes.md
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

export const REPO = "https://github.com/vant0m/shy-safari";

/**
 * The body of `## [version]` up to the next `## ` heading, without the link
 * references at the end of the file, or null if there is no such section.
 */
export function sectionFor(changelog: string, version: string): string | null {
  const lines = changelog.split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith(`## [${version}]`));
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  const body = (end === -1 ? rest : rest.slice(0, end)).filter(
    (line) => !/^\[[^\]]+\]: \S+$/.test(line),
  );
  return body.join("\n").trim();
}

/** Relative Markdown links, made to point at the repository at this tag. */
export function absoluteLinks(text: string, repo: string, tag: string): string {
  return text.replace(
    /\]\((?!https?:|#|mailto:)([^)\s]+)\)/g,
    (_, path: string) => `](${repo}/blob/${tag}/${path.replace(/^\.\//, "")})`,
  );
}

/**
 * Join hard-wrapped lines back into one line per paragraph or list item: a
 * Release page shows every newline as a line break, unlike a Markdown file.
 */
export function unwrap(text: string): string {
  const out: string[] = [];
  const blockStart = /^\s*([-*+] |\d+\. |#|\||>|```|<)/;
  for (const line of text.split("\n")) {
    const previous = out[out.length - 1];
    if (
      line.trim() !== "" &&
      previous !== undefined &&
      previous.trim() !== "" &&
      !previous.startsWith("#") &&
      !blockStart.test(line)
    ) {
      out[out.length - 1] = `${previous} ${line.trim()}`;
    } else {
      out.push(line);
    }
  }
  return out.join("\n");
}

/** The Release notes for a version, or null if CHANGELOG.md has none. */
export function notesFor(
  changelog: string,
  version: string,
  repo = REPO,
): string | null {
  const section = sectionFor(changelog, version);
  if (section === null) return null;
  const compare = changelog.match(
    new RegExp(`^\\[${version.replace(/\./g, "\\.")}\\]: (\\S+)$`, "m"),
  )?.[1];
  const notes = unwrap(absoluteLinks(section, repo, `v${version}`));
  return compare
    ? `${notes}\n\n**Full changelog:** ${compare}\n`
    : `${notes}\n`;
}

if (import.meta.main) {
  const [version, repo = REPO] = process.argv.slice(2);
  if (!version) {
    console.error("usage: bun scripts/release-notes.ts <version> [repoUrl]");
    process.exit(2);
  }
  const changelog = readFileSync(
    join(import.meta.dir, "..", "CHANGELOG.md"),
    "utf8",
  );
  const notes = notesFor(changelog, version.replace(/^v/, ""), repo);
  if (notes === null) {
    console.error(`CHANGELOG.md has no section for ${version}`);
    process.exit(1);
  }
  process.stdout.write(notes);
}
