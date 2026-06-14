import { canonicalEventSchema, type EventSchema } from "../../src/schema/canonical-event-schema";
import { gitHash } from "virtual:continuum-git-hash";
import { importWorkbenchData } from "virtual:continuum-import-workbench-data";
import "./styles.css";

type CanonicalEvent = (typeof importWorkbenchData.events)[number];
type RetrievalCandidate = (typeof importWorkbenchData.retrieval.candidates)[number];
type CodexConversationSearchResult = {
  rank: number;
  speaker: "Peter" | "Agent";
  snippet: string;
  projectionPath: string;
  sourceLabel: string;
  messageIndex: number;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shortId(value: string): string {
  return value.length > 18 ? `${value.slice(0, 18)}...` : value;
}

function eventTitle(event: CanonicalEvent): string {
  if (event.content.subject !== null && event.content.subject.trim().length > 0) {
    return event.content.subject;
  }

  return event.content.text.replace(/\s+/g, " ").trim().split(" ").slice(0, 10).join(" ");
}

function previewStats(preview: unknown): {
  recordsSeen: number;
  eventsCreated: number;
  recordsQuarantined: number;
  warnings: number;
} {
  if (
    typeof preview === "object" &&
    preview !== null &&
    "batch" in preview &&
    typeof preview.batch === "object" &&
    preview.batch !== null &&
    "stats" in preview.batch &&
    typeof preview.batch.stats === "object" &&
    preview.batch.stats !== null
  ) {
    const stats = preview.batch.stats as Record<string, unknown>;

    return {
      recordsSeen: Number(stats.recordsSeen ?? 0),
      eventsCreated: Number(stats.eventsCreated ?? 0),
      recordsQuarantined: Number(stats.recordsQuarantined ?? 0),
      warnings: Number(stats.warnings ?? 0),
    };
  }

  return {
    recordsSeen: 0,
    eventsCreated: 0,
    recordsQuarantined: 0,
    warnings: 0,
  };
}

function renderMetric(label: string, value: string | number): string {
  return `
    <div class="metric">
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(String(value))}</dd>
    </div>
  `;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function renderSourceBars(): string {
  const total = Math.max(importWorkbenchData.events.length, 1);

  return Object.entries(importWorkbenchData.sourceCounts)
    .sort((left, right) => right[1] - left[1])
    .map(([source, count]) => {
      const width = `${Math.max(4, (count / total) * 100).toFixed(1)}%`;

      return `
        <li class="source-row">
          <span>${escapeHtml(source)}</span>
          <strong>${count}</strong>
          <div><i style="width: ${width}"></i></div>
        </li>
      `;
    })
    .join("");
}

function renderPreviewRows(): string {
  return Object.entries(importWorkbenchData.previews)
    .map(([source, preview]) => {
      const stats = previewStats(preview);

      return `
        <tr>
          <td><code>${escapeHtml(source)}</code></td>
          <td>${stats.recordsSeen}</td>
          <td>${stats.eventsCreated}</td>
          <td>${stats.recordsQuarantined}</td>
          <td>${stats.warnings}</td>
        </tr>
      `;
    })
    .join("");
}

function renderTimelineRows(events: CanonicalEvent[]): string {
  return events
    .slice()
    .sort((left, right) => right.time.createdAt.localeCompare(left.time.createdAt))
    .slice(0, 40)
    .map(
      (event) => `
        <tr>
          <td>${escapeHtml(new Date(event.time.createdAt).toLocaleString())}</td>
          <td><code>${escapeHtml(event.source.platform)}</code></td>
          <td>${escapeHtml(event.actor.role)}</td>
          <td>${escapeHtml(eventTitle(event))}</td>
          <td><code>${escapeHtml(shortId(event.id))}</code></td>
        </tr>
      `,
    )
    .join("");
}

function renderCandidate(candidate: RetrievalCandidate, index: number): string {
  const signals = candidate.rankingSignals
    .map(
      (signal) => `
        <li>
          <span>${escapeHtml(signal.kind)}</span>
          <strong>${signal.value.toFixed(4)} x ${signal.weight}</strong>
        </li>
      `,
    )
    .join("");
  const evidence = candidate.signalEvidenceTrail
    .map(
      (signal) => `
        <li>
          <code>${escapeHtml(signal.rankingSignalKind)}</code>
          <span>${escapeHtml(signal.reason)}</span>
        </li>
      `,
    )
    .join("");

  return `
    <article class="candidate">
      <header>
        <span>${index + 1}</span>
        <div>
          <h3>${escapeHtml(candidate.title)}</h3>
          <p>${candidate.supportingEntryIds.length} supporting entries</p>
        </div>
        <strong>${candidate.confidence.toFixed(4)}</strong>
      </header>
      <div class="candidate-grid">
        <ul class="signal-list">${signals}</ul>
        <ul class="evidence-list">${evidence}</ul>
      </div>
    </article>
  `;
}

function fieldCount(schema: EventSchema): number {
  return schema.sections.reduce(
    (total, section) => total + section.fields.length,
    0,
  );
}

function renderSection(section: EventSchema["sections"][number]): string {
  const fields = section.fields
    .map(
      (field) => `
        <tr>
          <td><code>${escapeHtml(field.name)}</code></td>
          <td><code>${escapeHtml(field.type)}</code></td>
          <td>${field.required ? "yes" : "no"}</td>
          <td>${escapeHtml(field.description)}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <section class="panel schema-card">
      <h2>${escapeHtml(section.name)}</h2>
      <p>${escapeHtml(section.purpose)}</p>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Required</th>
            <th>Why it exists</th>
          </tr>
        </thead>
        <tbody>${fields}</tbody>
      </table>
    </section>
  `;
}

function renderCodexSearchPanel(): string {
  const stats = importWorkbenchData.codexConversationSearch;

  return `
    <section class="panel search-panel">
      <header class="section-header">
        <div>
          <h2>Codex Conversation Search</h2>
          <p><code>${escapeHtml(stats.databasePath)}</code></p>
        </div>
        <dl>
          ${renderMetric("Search Cache", stats.ready ? "ready" : "missing")}
          ${renderMetric("DB Size", formatBytes(stats.databaseBytes))}
          ${renderMetric("Projections", stats.projectionFileCount)}
        </dl>
      </header>
      <form id="codex-search-form" class="search-form">
        <label for="codex-search-query">Query</label>
        <input
          id="codex-search-query"
          name="query"
          type="search"
          value="blog posts"
          autocomplete="off"
          spellcheck="true"
        />
        <button type="submit">Search</button>
      </form>
      <div id="codex-search-status" class="search-status" role="status">
        Search the local SQLite FTS cache.
      </div>
      <ol id="codex-search-results" class="search-results"></ol>
    </section>
  `;
}

function renderSearchResult(result: CodexConversationSearchResult): string {
  return `
    <li>
      <article>
        <header>
          <strong>${result.rank}. ${escapeHtml(result.speaker)}</strong>
          <code>${escapeHtml(result.projectionPath)}#${result.messageIndex}</code>
        </header>
        <p>${escapeHtml(result.snippet)}</p>
      </article>
    </li>
  `;
}

function renderApp(schema: EventSchema): string {
  const candidates = importWorkbenchData.retrieval.candidates
    .map(renderCandidate)
    .join("");

  return `
    <header class="page-header">
      <div>
        <p class="eyebrow">Continuum workbench</p>
        <h1>Import Run</h1>
        <p class="path-line"><code>${escapeHtml(importWorkbenchData.eventsPath)}</code></p>
        <p class="git-hash">Git <code>${escapeHtml(gitHash)}</code></p>
      </div>
      <dl>
        ${renderMetric("Events", importWorkbenchData.events.length)}
        ${renderMetric("Sources", Object.keys(importWorkbenchData.sourceCounts).length)}
        ${renderMetric("Schema Fields", fieldCount(schema))}
      </dl>
    </header>

    <section class="dashboard-grid">
      <div class="panel">
        <h2>Source Mix</h2>
        <ul class="source-list">${renderSourceBars()}</ul>
      </div>
      <div class="panel">
        <h2>Dry Run Previews</h2>
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Records</th>
              <th>Events</th>
              <th>Quarantine</th>
              <th>Warnings</th>
            </tr>
          </thead>
          <tbody>${renderPreviewRows()}</tbody>
        </table>
      </div>
    </section>

    <section class="panel retrieval-panel">
      <header class="section-header">
        <div>
          <h2>Retrieval Probe</h2>
          <p><code>${escapeHtml(importWorkbenchData.retrieval.resumeRequest.text)}</code></p>
        </div>
        <dl>
          ${renderMetric("Ambiguous", importWorkbenchData.retrieval.isAmbiguous ? "yes" : "no")}
          ${renderMetric("Spread", importWorkbenchData.retrieval.candidateSpread ?? "none")}
        </dl>
      </header>
      <div class="candidate-stack">${candidates}</div>
    </section>

    ${renderCodexSearchPanel()}

    <section class="panel">
      <h2>Timeline</h2>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Source</th>
            <th>Actor</th>
            <th>Event</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody>${renderTimelineRows(importWorkbenchData.events)}</tbody>
      </table>
    </section>

    <section class="schema-grid">
      ${schema.sections.map(renderSection).join("")}
    </section>
  `;
}

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root");
}

app.innerHTML = renderApp(canonicalEventSchema);

const searchForm = document.querySelector<HTMLFormElement>("#codex-search-form");
const searchQuery = document.querySelector<HTMLInputElement>("#codex-search-query");
const searchStatus = document.querySelector<HTMLDivElement>("#codex-search-status");
const searchResults = document.querySelector<HTMLOListElement>("#codex-search-results");

async function runCodexSearch(query: string): Promise<void> {
  if (!searchStatus || !searchResults) {
    return;
  }

  searchStatus.textContent = "Searching...";
  searchResults.innerHTML = "";

  const response = await fetch(
    `/api/codex-conversation-search?query=${encodeURIComponent(query)}&limit=12`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );
  const payload = (await response.json()) as {
    results: CodexConversationSearchResult[];
    error: string | null;
  };

  if (payload.error !== null) {
    searchStatus.textContent = payload.error;
    return;
  }

  searchStatus.textContent = `${payload.results.length} result${payload.results.length === 1 ? "" : "s"}`;
  searchResults.innerHTML = payload.results.map(renderSearchResult).join("");
}

searchForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!searchQuery) {
    return;
  }

  void runCodexSearch(searchQuery.value);
});

if (searchQuery && importWorkbenchData.codexConversationSearch.ready) {
  void runCodexSearch(searchQuery.value);
}
