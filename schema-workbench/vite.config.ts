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
      transformIndexHtml(html) {
        return html.replace("%CONTINUUM_GIT_HASH%", currentGitHash());
      },
    },
  ],
});
