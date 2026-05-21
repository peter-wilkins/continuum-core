import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  normalizeGitCommit,
  parseGitLog,
  type GitCommitNormalizationInput,
} from "./index";

const gitFixture = readFileSync(
  fileURLToPath(new URL("./fixtures/git-one-commit.txt", import.meta.url)),
  "utf8",
);

describe("Git import", () => {
  it("parses one git log commit", () => {
    expect(parseGitLog(gitFixture)).toEqual({
      ok: true,
      value: [
        {
          hash: "db3c0f9cbbfd5909040b86afff175a2b96732898",
          authorName: "Peter Wilkins",
          authorEmail: "poppetew@gmail.com",
          date: "2026-05-21T13:25:39+01:00",
          subject: "Pressure test model with Wikimedia",
          body: "",
          filesChanged: [
            "docs/issues/009-pressure-test-model-with-wikimedia.md",
            "src/index.ts",
          ],
          statsSummary: "2 files changed, 156 insertions(+), 3 deletions(-)",
        },
      ],
    });
  });

  it("imports one Git commit into the canonical event model", () => {
    const parsed = parseGitLog(gitFixture);

    if (!parsed.ok) {
      throw new Error("Fixture should parse.");
    }

    const event = normalizeGitCommit({
      repository: {
        path: "continuum-core",
      },
      commit: parsed.value[0],
    } as GitCommitNormalizationInput);

    expect(event).toMatchObject({
      id: "git:continuum-core:db3c0f9cbbfd5909040b86afff175a2b96732898",
      source: {
        platform: "git",
        key: "git:continuum-core:db3c0f9cbbfd5909040b86afff175a2b96732898",
        externalConversationId: "continuum-core",
        externalMessageId: "db3c0f9cbbfd5909040b86afff175a2b96732898",
        artifactId: "continuum-core",
        externalParentId: null,
        canonicalParentEventId: null,
      },
      provenance: {
        sourceFamily: "software_development",
        sourceName: "git",
        upstreamSources: [],
        derivedFrom: [],
        retrievedAt: "unknown",
        license: null,
      },
      time: {
        createdAt: "2026-05-21T12:25:39.000Z",
        createdAtConfidence: "exact",
      },
      actor: {
        role: "user",
      },
      participants: [
        {
          role: "author",
          name: "Peter Wilkins",
          address: "poppetew@gmail.com",
        },
      ],
      content: {
        kind: "text",
        subject: "Pressure test model with Wikimedia",
        text: [
          "Pressure test model with Wikimedia",
          "Files:",
          "docs/issues/009-pressure-test-model-with-wikimedia.md",
          "src/index.ts",
          "2 files changed, 156 insertions(+), 3 deletions(-)",
        ].join("\n"),
      },
    });
    expect(event.source.fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });

  it("rejects a git log commit without a hash", () => {
    expect(parseGitLog("Author: Peter Wilkins <poppetew@gmail.com>")).toEqual({
      ok: false,
      errors: [
        {
          path: "commit.0.hash",
          message: "Required",
        },
      ],
    });
  });
});
