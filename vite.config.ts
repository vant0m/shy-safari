import tailwindcss from "@tailwindcss/vite";
import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

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
