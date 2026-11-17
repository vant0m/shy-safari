/**
 * Where Shy Safari lives on the web, for the few places that need absolute
 * addresses: canonical links, social previews, structured data and the
 * sitemap. The bare domain redirects here, so search engines are pointed here
 * and nowhere else.
 *
 * A self-hosted copy sets `PUBLIC_SITE_URL` at build time (see
 * `docs/hosting.md`), so its pages, sitemap and help text name its own
 * address rather than shysafari.com.
 */

const DEFAULT_SITE_URL = "https://www.shysafari.com";

export const SITE_URL: string = (
  (import.meta.env.PUBLIC_SITE_URL as string | undefined) || DEFAULT_SITE_URL
).replace(/\/+$/, "");

/** The address as a teacher would type it: no scheme, no leading `www.`. */
export const SITE_HOST = new URL(SITE_URL).host.replace(/^www\./, "");

/** Every page a search engine should know about, in sitemap order. */
export const PAGES = ["/", "/about", "/privacy"] as const;

export type PagePath = (typeof PAGES)[number];

/**
 * The picture link previews show: the savanna with a few animals out and the
 * name over it. A 1200×630 capture of the real Scene, in `static/`.
 */
export const PREVIEW_IMAGE = `${SITE_URL}/og-image.png`;

export function absoluteUrl(path: PagePath): string {
  return new URL(path, SITE_URL).href;
}
