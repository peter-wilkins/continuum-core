#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import {
  createImportScope,
  createPublicContinuumMaterialization,
  createPublicContinuumQuery,
  importScopeTitle,
} from "../dist/index.js";

const sourceDir = resolve("data/bootstrap-public-sources");
const scopePath = resolve(
  "src/fixtures/import-scope-extended-thought-brain-augmentation.json",
);
const outputPath = join(sourceDir, "materialized-preview.json");
const generatedAt = new Date().toISOString();

const scope = createImportScope(JSON.parse(await readFile(scopePath, "utf8")));
const query = createPublicContinuumQuery(scope, {
  id: "query:extended-thought-brain-augmentation-seed",
  scopeId: scope.id,
  text: "How have people tried to extend thought and augment the brain?",
  origin: "system_seed",
  createdAt: "2026-05-23T08:25:00.000Z",
});
const documents = await readPublicDocuments(sourceDir);
const materialization = createPublicContinuumMaterialization({
  scope,
  query,
  documents,
  generatedAt,
});

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `${JSON.stringify(
    {
      schemaVersion: "continuum.public-continuum-preview.v1",
      scope,
      scopeTitle: importScopeTitle(scope),
      query,
      materialization,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

process.stdout.write(
  [
    `Wrote ${outputPath}`,
    `events=${materialization.events.length}`,
    `active=${materialization.activeEventIds.length}`,
    `review=${materialization.reviewEventIds.length}`,
    `excluded=${materialization.excludedEventIds.length}`,
    `paragraphs=${materialization.sourceParagraphs.length}`,
    `lensOutputs=${materialization.lensOutputs.length}`,
    `thoughtCards=${materialization.thoughtCards.length}`,
  ].join(" ") + "\n",
);

async function readPublicDocuments(inputDir) {
  const filenames = (await readdir(inputDir))
    .filter((filename) => filename.endsWith(".public-document.json"))
    .sort();

  if (filenames.length === 0) {
    throw new Error(`No public-document JSON records found in ${inputDir}`);
  }

  return Promise.all(
    filenames.map(async (filename) =>
      JSON.parse(await readFile(join(inputDir, filename), "utf8")),
    ),
  );
}
