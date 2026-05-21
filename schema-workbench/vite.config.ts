import { execSync } from "node:child_process";
import { defineConfig } from "vite";

function currentGitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD", {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

export default defineConfig({
  plugins: [
    {
      name: "continuum-git-hash",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (request.url?.includes("virtual:continuum-git-hash")) {
            response.setHeader("Cache-Control", "no-store");
          }

          next();
        });
      },
      resolveId(id) {
        if (id === "virtual:continuum-git-hash") {
          return "\0virtual:continuum-git-hash";
        }

        return null;
      },
      load(id) {
        if (id === "\0virtual:continuum-git-hash") {
          return `export const gitHash = ${JSON.stringify(currentGitHash())};`;
        }

        return null;
      },
    },
  ],
});
