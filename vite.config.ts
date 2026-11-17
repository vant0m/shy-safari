import tailwindcss from "@tailwindcss/vite";
import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { execSync } from "node:child_process";
import { defineConfig } from "vite";

/**
 * One name for this build. SvelteKit names its page globals after it, so the
 * prerendered HTML and the client code must agree on it; its default,
 * `Date.now()`, was sometimes read twice in one build, and the page then
 * failed to start ("Cannot read properties of undefined (reading 'data')").
 * The commit is stable for the whole build and still changes on every deploy.
 */
function buildVersion(): string {
  if (process.env.BUILD_VERSION) return process.env.BUILD_VERSION;
  try {
    return execSync("git rev-parse --short HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "local";
  }
}

export default defineConfig({
  server: {
    // Hostnames the dev server answers to besides localhost, say behind a
    // tunnel or reverse proxy: a comma-separated DEV_ALLOWED_HOSTS.
    allowedHosts: process.env.DEV_ALLOWED_HOSTS?.split(",")
      .map((host) => host.trim())
      .filter(Boolean),
  },
  // Expose the Cloudflare Web Analytics token (set only as a build variable on
  // the production Cloudflare build) and the site's own address (set by a
  // self-hosted copy, see docs/hosting.md) to client code.
  envPrefix: ["VITE_", "CF_BEACON_TOKEN", "PUBLIC_SITE_URL"],
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
      },

      // Everything happens in the browser: the microphone never leaves the
      // device and there is no server to talk to.
      adapter: adapter({ fallback: "404.html" }),

      version: { name: buildVersion() },

      prerender: {
        // #how-it-works opens the info drawer rather than naming an element,
        // so nothing on the page carries that id on purpose.
        handleMissingId: ({ id, message }) => {
          if (id !== "how-it-works") throw new Error(message);
        },
      },
    }),
  ],
});
