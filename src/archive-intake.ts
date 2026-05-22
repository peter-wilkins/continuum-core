import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, join } from "node:path";
import { strFromU8, unzipSync } from "fflate";

import { type CanonicalEvent, type ImportErrorRecord } from "./index";
import {
  classifySourceFile,
  normalizeSourceInput,
  prepareSourceInput,
  sourceInputNeedsJson,
  type ImportCommand,
} from "./import-source-adapters";

export type ArchiveSourceFile = {
  path: string;
  relativePath: string;
  raw: string;
  hash: string;
};

export type ArchiveReadResult = {
  files: ArchiveSourceFile[];
  hash: string;
  filesSeen: number;
  parseError: string | null;
};

export type SourceFilePreview = {
  path: string;
  source: ImportCommand | null;
  status: "matched" | "skipped" | "invalid";
  eventsCreated: number;
  quarantineRecords: number;
};

export type ArchiveNormalizeResult = {
  incomingEvents: CanonicalEvent[];
  quarantine: ImportErrorRecord[];
  sourceFiles: SourceFilePreview[];
  warnings: number;
};

export async function readTakeoutArchive(
  source: "google-takeout-folder" | "google-takeout-zip",
  inputPath: string,
  excludePath: string | null,
): Promise<ArchiveReadResult> {
  if (source === "google-takeout-folder") {
    const files = await readTakeoutFolder(inputPath, excludePath);
    const hash = createHash("sha256");

    for (const file of files) {
      hash.update(file.relativePath);
      hash.update(file.hash);
    }

    return {
      files,
      hash: hash.digest("hex"),
      filesSeen: files.length,
      parseError: null,
    };
  }

  const rawBuffer = await readFile(inputPath);

  try {
    const files = readTakeoutZip(rawBuffer);

    return {
      files,
      hash: createHash("sha256").update(rawBuffer).digest("hex"),
      filesSeen: files.length,
      parseError: null,
    };
  } catch (error: unknown) {
    return {
      files: [],
      hash: createHash("sha256").update(rawBuffer).digest("hex"),
      filesSeen: 1,
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
}

function readTakeoutZip(raw: Uint8Array): ArchiveSourceFile[] {
  const files: ArchiveSourceFile[] = [];
  const unzipped = unzipSync(raw);

  for (const [relativePath, content] of Object.entries(unzipped)) {
    if (relativePath.endsWith("/")) {
      continue;
    }

    const decoded = strFromU8(content);

    files.push({
      path: relativePath,
      relativePath,
      raw: decoded,
      hash: createHash("sha256").update(decoded).digest("hex"),
    });
  }

  return files.sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
}

async function readTakeoutFolder(
  inputPath: string,
  excludePath: string | null,
): Promise<ArchiveSourceFile[]> {
  const files: ArchiveSourceFile[] = [];
  const excludedAbsolutePath = excludePath === null ? null : resolve(excludePath);

  async function walk(currentPath: string, relativePrefix: string): Promise<void> {
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const path = join(currentPath, entry.name);
      const relativePath = relativePrefix ? join(relativePrefix, entry.name) : entry.name;

      if (entry.isDirectory()) {
        await walk(path, relativePath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (excludedAbsolutePath !== null && resolve(path) === excludedAbsolutePath) {
        continue;
      }

      const raw = await readFile(path, "utf8");

      files.push({
        path,
        relativePath,
        raw,
        hash: createHash("sha256").update(raw).digest("hex"),
      });
    }
  }

  const inputStat = await stat(inputPath);

  if (!inputStat.isDirectory()) {
    throw new Error("google-takeout-folder input must be a directory.");
  }

  await walk(inputPath, "");

  return files.sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
}

export function normalizeArchiveFiles(
  files: ArchiveSourceFile[],
): ArchiveNormalizeResult {
  const incomingEvents: CanonicalEvent[] = [];
  const quarantine: ImportErrorRecord[] = [];
  const sourceFiles: SourceFilePreview[] = [];
  let warnings = 0;

  for (const file of files) {
    const source = classifySourceFile(file);

    if (source === null) {
      warnings += 1;
      sourceFiles.push({
        path: file.relativePath,
        source: null,
        status: "skipped",
        eventsCreated: 0,
        quarantineRecords: 0,
      });
      continue;
    }

    let parsed: unknown;

    try {
      parsed = sourceInputNeedsJson(source) ? JSON.parse(file.raw) as unknown : file.raw;
      parsed = prepareSourceInput(source, parsed, {
        inputPath: file.path,
        relativePath: file.relativePath,
        modifiedAt: "1970-01-01T00:00:00.000Z",
        modifiedAtConfidence: "unknown",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      quarantine.push({
        sourcePath: file.relativePath,
        recordIndex: null,
        errorCode: "source_parse_failed",
        message: `google-takeout-folder:${file.relativePath}: ${message}`,
        recoverable: true,
      });
      sourceFiles.push({
        path: file.relativePath,
        source,
        status: "invalid",
        eventsCreated: 0,
        quarantineRecords: 1,
      });
      continue;
    }

    const result = normalizeSourceInput(source, parsed);
    const fileQuarantine = result.quarantine.map((record) => ({
      ...record,
      sourcePath: record.sourcePath
        ? `${file.relativePath}:${record.sourcePath}`
        : file.relativePath,
    }));

    for (const event of result.incomingEvents) {
      incomingEvents.push(event);
    }

    for (const record of fileQuarantine) {
      quarantine.push(record);
    }
    sourceFiles.push({
      path: file.relativePath,
      source,
      status: fileQuarantine.length > 0 ? "invalid" : "matched",
      eventsCreated: result.incomingEvents.length,
      quarantineRecords: fileQuarantine.length,
    });
  }

  return { incomingEvents, quarantine, sourceFiles, warnings };
}
