#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const outputDir = resolve("data/bootstrap-public-sources");
const retrievedAt = new Date().toISOString();
const wikipediaPages = [
  "Extended mind thesis",
  "Distributed cognition",
  "Intelligence amplification",
  "Augmented cognition",
  "Brain–computer interface",
  "Neurotechnology",
];

await mkdir(outputDir, { recursive: true });

const records = [];

for (const title of wikipediaPages) {
  const page = await fetchWikipediaPage(title);
  const record = wikipediaPageToPublicDocument(page);
  const filename = `${slugify(page.title)}.public-document.json`;
  await writeFile(join(outputDir, filename), `${JSON.stringify(record, null, 2)}\n`, "utf8");
  records.push({
    title: page.title,
    pageid: page.pageid,
    filename,
    revision: page.revisions[0].revid,
    touched: page.touched,
  });
}

await writeFile(
  join(outputDir, "manifest.json"),
  `${JSON.stringify(
    {
      schemaVersion: "continuum.bootstrap-public-sources.v1",
      retrievedAt,
      source: "https://en.wikipedia.org/w/api.php",
      records,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

process.stdout.write(`Wrote ${records.length} bootstrap public source records to ${outputDir}\n`);

async function fetchWikipediaPage(title) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    redirects: "1",
    prop: "extracts|info|revisions",
    exlimit: "1",
    explaintext: "1",
    inprop: "url",
    rvprop: "ids|timestamp",
    titles: title,
  });
  const response = await fetchWithRetry(
    `https://en.wikipedia.org/w/api.php?${params}`,
    title,
  );

  if (!response.ok) {
    throw new Error(`Wikipedia fetch failed for ${title}: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const page = Object.values(payload.query.pages)[0];

  if (!page || page.missing !== undefined) {
    throw new Error(`Wikipedia page not found: ${title}`);
  }

  if (typeof page.extract !== "string" || page.extract.trim().length === 0) {
    throw new Error(`Wikipedia page has no extract text: ${title}`);
  }

  return page;
}

async function fetchWithRetry(url, title) {
  const attempts = 3;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "continuum-core bootstrap public source fetcher (local dogfooding)",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);

      if (attempt === attempts) {
        throw error;
      }

      process.stderr.write(
        `Retrying Wikipedia fetch for ${title} after attempt ${attempt} failed\n`,
      );
      await new Promise((resolvePromise) => setTimeout(resolvePromise, attempt * 1000));
    }
  }

  throw new Error(`Wikipedia fetch failed for ${title}`);
}

function wikipediaPageToPublicDocument(page) {
  const revision = page.revisions[0];

  return {
    source: {
      platform: "wikimedia",
      sourceFamily: "wikimedia",
      sourceName: "wikipedia",
      sourceId: String(page.pageid),
      sourceUrl: page.fullurl,
      retrievedAt,
      license: "Wikipedia text is available under CC BY-SA 4.0; additional terms may apply.",
      upstreamSources: ["en.wikipedia.org"],
      derivedFrom: [`enwiki-revision:${revision.revid}`],
    },
    document: {
      title: page.title,
      language: "en",
      publishedAt: revision.timestamp,
      publishedAtConfidence: "exact",
      creators: [
        {
          role: "author",
          name: "Wikipedia contributors",
        },
      ],
      subjectTags: [
        "extended thought",
        "brain augmentation",
        page.title,
      ],
      text: page.extract,
    },
  };
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}
