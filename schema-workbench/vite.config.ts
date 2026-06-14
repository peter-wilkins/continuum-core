import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
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

type CanonicalEvent = {
  id: string;
  source: {
    platform: string;
  };
  provenance: {
    sourceName: string;
  };
  time: {
    createdAt: string;
  };
  actor: {
    role: string;
  };
  content: {
    subject: string | null;
    text: string;
  };
};

type CodexConversationSearchResult = {
  rank: number;
  speaker: "Peter" | "Agent";
  snippet: string;
  projectionPath: string;
  sourceLabel: string;
  messageIndex: number;
};

function readJsonFile(path: string): unknown | null {
  if (!existsSync(path)) {
    return null;
  }

  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function readJsonlEvents(path: string): CanonicalEvent[] {
  if (!existsSync(path)) {
    return [];
  }

  return readFileSync(path, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as CanonicalEvent);
}

function sourceCounts(events: CanonicalEvent[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const event of events) {
    counts[event.source.platform] = (counts[event.source.platform] ?? 0) + 1;
  }

  return counts;
}

function fileSize(path: string): number {
  if (!existsSync(path)) {
    return 0;
  }

  return statSync(path).size;
}

function countFiles(path: string, suffix: string): number {
  if (!existsSync(path)) {
    return 0;
  }

  let count = 0;

  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const entryPath = join(path, entry.name);

    if (entry.isDirectory()) {
      count += countFiles(entryPath, suffix);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(suffix)) {
      count += 1;
    }
  }

  return count;
}

function codexConversationSearchStats(repoRoot: string) {
  const conversationFlowDirectory = resolve(
    repoRoot,
    "local/codex-session-conversations/conversation-flow",
  );
  const databasePath = resolve(
    repoRoot,
    "local/codex-session-conversations/search-cache/search.sqlite",
  );

  return {
    ready: existsSync(databasePath),
    databasePath: "local/codex-session-conversations/search-cache/search.sqlite",
    databaseBytes: fileSize(databasePath),
    conversationFlowDirectory: "local/codex-session-conversations/conversation-flow",
    projectionFileCount: countFiles(conversationFlowDirectory, ".conversation-flow.txt"),
  };
}

async function searchCodexConversation(repoRoot: string, query: string, limit: number): Promise<{
  results: CodexConversationSearchResult[];
  error: string | null;
}> {
  if (query.trim().length === 0) {
    return {
      results: [],
      error: "Enter a query.",
    };
  }

  try {
    const indexModule = await import(pathToFileURL(resolve(repoRoot, "dist/index.js")).href);
    const results = indexModule.searchCodexConversationFlow({
      databasePath: resolve(
        repoRoot,
        "local/codex-session-conversations/search-cache/search.sqlite",
      ),
      query,
      limit,
    }) as CodexConversationSearchResult[];

    return {
      results,
      error: null,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    return {
      results: [],
      error: message,
    };
  }
}

async function importWorkbenchData() {
  const repoRoot = process.cwd();
  const runRoot = resolve(repoRoot, "data/run-current");
  const eventsPath = resolve(runRoot, "events.jsonl");
  const events = readJsonlEvents(eventsPath);
  const indexModule = await import(pathToFileURL(resolve(repoRoot, "dist/index.js")).href);
  const resumeRequest = {
    text: "resume voice transcripts reliability fallback costs",
    requestedAt: new Date().toISOString(),
  };
  const entries = events.map(indexModule.createImportedEntryFromCanonicalEvent);
  const candidates = indexModule
    .retrieveContinuationCandidates({
      resumeRequest,
      entries,
      rankingProfile: indexModule.debugRankingProfiles.balanced,
    })
    .slice(0, 8);
  const surface = indexModule.createAmbiguousResumeSurface({
    resumeRequest,
    entries,
    rankingProfile: indexModule.debugRankingProfiles.balanced,
    narrowSpreadThreshold: 0.1,
  });

  return {
    generatedAt: new Date().toISOString(),
    runRoot: "data/run-current",
    eventsPath: "data/run-current/events.jsonl",
    previews: {
      claude: readJsonFile(resolve(runRoot, "claude-preview.json")),
      calendar: readJsonFile(resolve(runRoot, "calendar-preview.json")),
      git: readJsonFile(resolve(runRoot, "git-preview.json")),
    },
    sourceCounts: sourceCounts(events),
    events,
    retrieval: {
      resumeRequest,
      isAmbiguous: surface.isAmbiguous,
      candidateSpread: surface.candidateSpread,
      candidates,
    },
    codexConversationSearch: codexConversationSearchStats(repoRoot),
  };
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
    {
      name: "continuum-import-workbench-data",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (request.url?.includes("virtual:continuum-import-workbench-data")) {
            response.setHeader("Cache-Control", "no-store");
          }

          next();
        });
      },
      resolveId(id) {
        if (id === "virtual:continuum-import-workbench-data") {
          return "\0virtual:continuum-import-workbench-data";
        }

        return null;
      },
      async load(id) {
        if (id === "\0virtual:continuum-import-workbench-data") {
          return `export const importWorkbenchData = ${JSON.stringify(
            await importWorkbenchData(),
          )};`;
        }

        return null;
      },
    },
    {
      name: "continuum-codex-conversation-search-api",
      configureServer(server) {
        server.middlewares.use(async (request, response, next) => {
          const url = new URL(request.url ?? "/", "http://127.0.0.1");

          if (url.pathname !== "/api/codex-conversation-search") {
            next();
            return;
          }

          const query = url.searchParams.get("query") ?? "";
          const limit = Number(url.searchParams.get("limit") ?? "10");
          const payload = await searchCodexConversation(
            process.cwd(),
            query,
            Number.isSafeInteger(limit) && limit > 0 ? Math.min(limit, 50) : 10,
          );
          response.setHeader("Content-Type", "application/json");
          response.setHeader("Cache-Control", "no-store");
          response.end(JSON.stringify(payload));
        });
      },
    },
  ],
});
