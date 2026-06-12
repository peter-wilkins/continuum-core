import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  mkdir,
  opendir,
  stat,
  writeFile,
} from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";
import { createInterface } from "node:readline";

export type CodexSessionMirrorAuditCommand = {
  rootPath: string;
  outputDirectory: string;
  generatedAt: string;
  largestFileLimit: number;
  newestOldestLimit: number;
  sampleFileLimit: number;
  sampleLineLimit: number;
  duplicateHashByteLimit: number;
};

export type SizeHistogramBucket = {
  label: string;
  minBytes: number;
  maxBytes: number | null;
  fileCount: number;
  totalBytes: number;
};

export type FileSummary = {
  relativePath: string;
  sizeBytes: number;
  modifiedAt: string;
};

export type DuplicateSummary = {
  exactDuplicateGroupCount: number;
  exactDuplicateFileCount: number;
  exactDuplicateBytes: number;
  sameSizeCandidateGroupCount: number;
  sameSizeCandidateFileCount: number;
  hashedFileCount: number;
  hashedBytes: number;
  hashByteLimit: number;
  hashComplete: boolean;
};

export type JsonlShapeSummary = {
  sampledFileCount: number;
  sampledLineCount: number;
  sampledBytes: number;
  parsedLineCount: number;
  malformedLineCount: number;
  eventTypeHistogram: Record<string, number>;
  roleHistogram: Record<string, number>;
};

export type ProjectionEstimate = {
  method: string;
  sampledBytes: number;
  sampledProjectionBytes: number;
  estimatedProjectionBytes: number;
};

export type CodexSessionMirrorAuditReport = {
  schemaVersion: "continuum.codex.session-mirror.audit.v1";
  generatedAt: string;
  rootPath: string;
  privacy: {
    rawBlobsDeleted: false;
    rawBlobsRewritten: false;
    reportContainsRawContent: false;
  };
  totals: {
    fileCount: number;
    directoryCount: number;
    totalBytes: number;
  };
  sizeHistogram: SizeHistogramBucket[];
  newestFiles: FileSummary[];
  oldestFiles: FileSummary[];
  largestFiles: FileSummary[];
  duplicates: DuplicateSummary;
  jsonlShape: JsonlShapeSummary;
  projectionEstimate: ProjectionEstimate;
  warnings: string[];
  recommendedNextAction: string;
};

type DiscoveredFile = {
  absolutePath: string;
  relativePath: string;
  sizeBytes: number;
  modifiedAt: string;
};

const sizeBuckets: Array<{ label: string; minBytes: number; maxBytes: number | null }> = [
  { label: "<1KB", minBytes: 0, maxBytes: 1024 },
  { label: "1KB-1MB", minBytes: 1024, maxBytes: 1024 * 1024 },
  { label: "1MB-16MB", minBytes: 1024 * 1024, maxBytes: 16 * 1024 * 1024 },
  { label: "16MB-64MB", minBytes: 16 * 1024 * 1024, maxBytes: 64 * 1024 * 1024 },
  { label: "64MB-256MB", minBytes: 64 * 1024 * 1024, maxBytes: 256 * 1024 * 1024 },
  { label: ">=256MB", minBytes: 256 * 1024 * 1024, maxBytes: null },
];

export function createCodexSessionMirrorAuditCommand(
  input: CodexSessionMirrorAuditCommand,
): CodexSessionMirrorAuditCommand {
  if (input.largestFileLimit < 1) {
    throw new Error("largestFileLimit must be at least 1");
  }

  if (input.newestOldestLimit < 1) {
    throw new Error("newestOldestLimit must be at least 1");
  }

  if (input.sampleFileLimit < 1) {
    throw new Error("sampleFileLimit must be at least 1");
  }

  if (input.sampleLineLimit < 1) {
    throw new Error("sampleLineLimit must be at least 1");
  }

  if (input.duplicateHashByteLimit < 0) {
    throw new Error("duplicateHashByteLimit must be zero or greater");
  }

  return input;
}

export async function auditCodexSessionMirror(
  command: CodexSessionMirrorAuditCommand,
): Promise<CodexSessionMirrorAuditReport> {
  const safeCommand = createCodexSessionMirrorAuditCommand(command);
  const rootPath = resolve(safeCommand.rootPath);
  const warnings: string[] = [];
  const discovered = await discoverFiles(rootPath, warnings);
  const files = discovered.files;
  const totals = {
    fileCount: files.length,
    directoryCount: discovered.directoryCount,
    totalBytes: files.reduce((sum, file) => sum + file.sizeBytes, 0),
  };
  const largestFiles = [...files]
    .sort((left, right) => right.sizeBytes - left.sizeBytes || left.relativePath.localeCompare(right.relativePath))
    .slice(0, safeCommand.largestFileLimit)
    .map(toFileSummary);
  const newestFiles = [...files]
    .sort((left, right) => right.modifiedAt.localeCompare(left.modifiedAt) || left.relativePath.localeCompare(right.relativePath))
    .slice(0, safeCommand.newestOldestLimit)
    .map(toFileSummary);
  const oldestFiles = [...files]
    .sort((left, right) => left.modifiedAt.localeCompare(right.modifiedAt) || left.relativePath.localeCompare(right.relativePath))
    .slice(0, safeCommand.newestOldestLimit)
    .map(toFileSummary);
  const jsonlSamples = selectJsonlSamples(files, safeCommand.sampleFileLimit);
  const jsonlShape = await inspectJsonlShape(jsonlSamples, safeCommand.sampleLineLimit, warnings);
  const projectionEstimate = estimateProjectionSize(
    jsonlShape,
    totals.totalBytes,
  );
  const duplicates = await inspectExactDuplicates(
    files,
    safeCommand.duplicateHashByteLimit,
    warnings,
  );

  return {
    schemaVersion: "continuum.codex.session-mirror.audit.v1",
    generatedAt: safeCommand.generatedAt,
    rootPath,
    privacy: {
      rawBlobsDeleted: false,
      rawBlobsRewritten: false,
      reportContainsRawContent: false,
    },
    totals,
    sizeHistogram: createSizeHistogram(files),
    newestFiles,
    oldestFiles,
    largestFiles,
    duplicates,
    jsonlShape,
    projectionEstimate,
    warnings,
    recommendedNextAction: chooseRecommendedNextAction(totals.fileCount, duplicates.hashComplete),
  };
}

export async function writeCodexSessionMirrorAuditReport(
  command: CodexSessionMirrorAuditCommand,
  report: CodexSessionMirrorAuditReport,
): Promise<{ jsonPath: string; markdownPath: string }> {
  const outputDirectory = resolve(command.outputDirectory);
  await mkdir(outputDirectory, { recursive: true });
  const jsonPath = join(outputDirectory, "summary.json");
  const markdownPath = join(outputDirectory, "summary.md");

  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, renderCodexSessionMirrorAuditMarkdown(report), "utf8");

  return { jsonPath, markdownPath };
}

export function renderCodexSessionMirrorAuditMarkdown(
  report: CodexSessionMirrorAuditReport,
): string {
  const lines = [
    "# Codex Session Mirror Storage Audit",
    "",
    `Generated: ${report.generatedAt}`,
    `Root: ${report.rootPath}`,
    "",
    "## Safety",
    "",
    `- Raw blobs deleted: ${String(report.privacy.rawBlobsDeleted)}`,
    `- Raw blobs rewritten: ${String(report.privacy.rawBlobsRewritten)}`,
    `- Report contains raw content: ${String(report.privacy.reportContainsRawContent)}`,
    "",
    "## Totals",
    "",
    `- Files: ${report.totals.fileCount}`,
    `- Directories: ${report.totals.directoryCount}`,
    `- Bytes: ${report.totals.totalBytes}`,
    "",
    "## Size Histogram",
    "",
    "| Bucket | Files | Bytes |",
    "| --- | ---: | ---: |",
    ...report.sizeHistogram.map(
      (bucket) => `| ${bucket.label} | ${bucket.fileCount} | ${bucket.totalBytes} |`,
    ),
    "",
    "## Duplicates",
    "",
    `- Exact duplicate groups: ${report.duplicates.exactDuplicateGroupCount}`,
    `- Exact duplicate files: ${report.duplicates.exactDuplicateFileCount}`,
    `- Exact duplicate bytes: ${report.duplicates.exactDuplicateBytes}`,
    `- Same-size candidate groups: ${report.duplicates.sameSizeCandidateGroupCount}`,
    `- Hash complete: ${String(report.duplicates.hashComplete)}`,
    `- Hashed bytes: ${report.duplicates.hashedBytes} of limit ${report.duplicates.hashByteLimit}`,
    "",
    "## JSONL Shape Sample",
    "",
    `- Sampled files: ${report.jsonlShape.sampledFileCount}`,
    `- Sampled lines: ${report.jsonlShape.sampledLineCount}`,
    `- Parsed lines: ${report.jsonlShape.parsedLineCount}`,
    `- Malformed lines: ${report.jsonlShape.malformedLineCount}`,
    "",
    "Event/type histogram:",
    "",
    ...renderHistogramLines(report.jsonlShape.eventTypeHistogram),
    "",
    "Role histogram:",
    "",
    ...renderHistogramLines(report.jsonlShape.roleHistogram),
    "",
    "## Projection Estimate",
    "",
    `- Method: ${report.projectionEstimate.method}`,
    `- Sampled bytes: ${report.projectionEstimate.sampledBytes}`,
    `- Sampled projection bytes: ${report.projectionEstimate.sampledProjectionBytes}`,
    `- Estimated projection bytes: ${report.projectionEstimate.estimatedProjectionBytes}`,
    "",
    "## Largest Files",
    "",
    ...renderFileLines(report.largestFiles),
    "",
    "## Newest Files",
    "",
    ...renderFileLines(report.newestFiles),
    "",
    "## Oldest Files",
    "",
    ...renderFileLines(report.oldestFiles),
    "",
    "## Warnings",
    "",
    ...(report.warnings.length === 0 ? ["- none"] : report.warnings.map((warning) => `- ${warning}`)),
    "",
    "## Recommended Next Action",
    "",
    report.recommendedNextAction,
    "",
  ];

  return `${lines.join("\n")}\n`;
}

async function discoverFiles(
  rootPath: string,
  warnings: string[],
): Promise<{ files: DiscoveredFile[]; directoryCount: number }> {
  const files: DiscoveredFile[] = [];
  let directoryCount = 0;

  async function walk(directory: string): Promise<void> {
    directoryCount += 1;
    const entries = await opendir(directory);

    for await (const entry of entries) {
      const absolutePath = join(directory, entry.name);

      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      if (!entry.isFile()) {
        warnings.push(`Skipped non-file entry: ${relative(rootPath, absolutePath)}`);
        continue;
      }

      const fileStat = await stat(absolutePath);
      files.push({
        absolutePath,
        relativePath: relative(rootPath, absolutePath),
        sizeBytes: fileStat.size,
        modifiedAt: fileStat.mtime.toISOString(),
      });
    }
  }

  try {
    await walk(rootPath);
  } catch (error: unknown) {
    if (hasErrorCode(error, "ENOENT")) {
      warnings.push(`Root path does not exist: ${rootPath}`);
      return { files, directoryCount: 0 };
    }

    throw error;
  }

  return { files, directoryCount };
}

function createSizeHistogram(files: DiscoveredFile[]): SizeHistogramBucket[] {
  return sizeBuckets.map((bucket) => {
    const bucketFiles = files.filter(
      (file) =>
        file.sizeBytes >= bucket.minBytes &&
        (bucket.maxBytes === null || file.sizeBytes < bucket.maxBytes),
    );

    return {
      label: bucket.label,
      minBytes: bucket.minBytes,
      maxBytes: bucket.maxBytes,
      fileCount: bucketFiles.length,
      totalBytes: bucketFiles.reduce((sum, file) => sum + file.sizeBytes, 0),
    };
  });
}

async function inspectExactDuplicates(
  files: DiscoveredFile[],
  hashByteLimit: number,
  warnings: string[],
): Promise<DuplicateSummary> {
  const bySize = new Map<number, DiscoveredFile[]>();

  for (const file of files) {
    const sameSize = bySize.get(file.sizeBytes) ?? [];
    sameSize.push(file);
    bySize.set(file.sizeBytes, sameSize);
  }

  const candidateGroups = [...bySize.values()].filter((group) => group.length > 1);
  const candidateFiles = candidateGroups.flat();
  const byHash = new Map<string, DiscoveredFile[]>();
  let hashedBytes = 0;
  let hashedFileCount = 0;
  let hashComplete = true;

  for (const file of candidateFiles) {
    if (hashedBytes + file.sizeBytes > hashByteLimit) {
      hashComplete = false;
      continue;
    }

    const hash = await sha256File(file.absolutePath);
    const existing = byHash.get(hash) ?? [];
    existing.push(file);
    byHash.set(hash, existing);
    hashedBytes += file.sizeBytes;
    hashedFileCount += 1;
  }

  if (!hashComplete) {
    warnings.push("Duplicate hashing stopped at duplicateHashByteLimit; exact duplicate counts are partial.");
  }

  const exactDuplicateGroups = [...byHash.values()].filter((group) => group.length > 1);

  return {
    exactDuplicateGroupCount: exactDuplicateGroups.length,
    exactDuplicateFileCount: exactDuplicateGroups.reduce((sum, group) => sum + group.length, 0),
    exactDuplicateBytes: exactDuplicateGroups.reduce(
      (sum, group) => sum + group.slice(1).reduce((inner, file) => inner + file.sizeBytes, 0),
      0,
    ),
    sameSizeCandidateGroupCount: candidateGroups.length,
    sameSizeCandidateFileCount: candidateFiles.length,
    hashedFileCount,
    hashedBytes,
    hashByteLimit,
    hashComplete,
  };
}

async function sha256File(path: string): Promise<string> {
  const hash = createHash("sha256");

  await new Promise<void>((resolvePromise, rejectPromise) => {
    const stream = createReadStream(path);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", rejectPromise);
    stream.on("end", resolvePromise);
  });

  return hash.digest("hex");
}

function selectJsonlSamples(files: DiscoveredFile[], limit: number): DiscoveredFile[] {
  const jsonlFiles = files.filter((file) => extname(file.relativePath).toLowerCase() === ".jsonl");
  const selected = new Map<string, DiscoveredFile>();
  const sortedBySize = [...jsonlFiles].sort(
    (left, right) => right.sizeBytes - left.sizeBytes || left.relativePath.localeCompare(right.relativePath),
  );
  const sortedByTime = [...jsonlFiles].sort(
    (left, right) => right.modifiedAt.localeCompare(left.modifiedAt) || left.relativePath.localeCompare(right.relativePath),
  );

  for (const file of [...sortedBySize, ...sortedByTime, ...jsonlFiles]) {
    if (selected.size >= limit) {
      break;
    }

    selected.set(file.relativePath, file);
  }

  return [...selected.values()];
}

async function inspectJsonlShape(
  files: DiscoveredFile[],
  lineLimit: number,
  warnings: string[],
): Promise<JsonlShapeSummary> {
  const eventTypeHistogram: Record<string, number> = {};
  const roleHistogram: Record<string, number> = {};
  let sampledLineCount = 0;
  let sampledBytes = 0;
  let parsedLineCount = 0;
  let malformedLineCount = 0;

  for (const file of files) {
    const stream = createReadStream(file.absolutePath, { encoding: "utf8" });
    const lines = createInterface({ input: stream, crlfDelay: Infinity });
    let fileLineCount = 0;

    try {
      for await (const line of lines) {
        if (fileLineCount >= lineLimit) {
          break;
        }

        fileLineCount += 1;
        sampledLineCount += 1;
        sampledBytes += Buffer.byteLength(line, "utf8") + 1;

        if (line.trim().length === 0) {
          continue;
        }

        try {
          const parsed = JSON.parse(line) as Record<string, unknown>;
          parsedLineCount += 1;
          increment(eventTypeHistogram, readEventType(parsed));
          increment(roleHistogram, readRole(parsed));
        } catch {
          malformedLineCount += 1;
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`Could not sample JSONL shape for ${file.relativePath}: ${message}`);
    }
  }

  return {
    sampledFileCount: files.length,
    sampledLineCount,
    sampledBytes,
    parsedLineCount,
    malformedLineCount,
    eventTypeHistogram,
    roleHistogram,
  };
}

function readEventType(parsed: Record<string, unknown>): string {
  const candidates = [parsed.type, parsed.eventType, parsed.kind];
  const found = candidates.find((value) => typeof value === "string" && value.length > 0);
  return typeof found === "string" ? found : "unknown";
}

function readRole(parsed: Record<string, unknown>): string {
  const directRole = parsed.role;

  if (typeof directRole === "string" && directRole.length > 0) {
    return directRole;
  }

  const message = parsed.message;

  if (isRecord(message) && typeof message.role === "string" && message.role.length > 0) {
    return message.role;
  }

  return "unknown";
}

function estimateProjectionSize(
  shape: JsonlShapeSummary,
  totalBytes: number,
): ProjectionEstimate {
  const conversationLines =
    (shape.roleHistogram.user ?? 0) +
    (shape.roleHistogram.assistant ?? 0) +
    (shape.roleHistogram.system ?? 0);
  const sampledProjectionBytes = conversationLines * 900;
  const estimatedProjectionBytes =
    shape.sampledLineCount === 0
      ? 0
      : Math.round(totalBytes * (sampledProjectionBytes / Math.max(shape.sampledBytes, 1)));

  return {
    method:
      "Rough first-slice estimate: count sampled conversational roles and budget about 900 bytes per retained turn plus references.",
    sampledBytes: shape.sampledBytes,
    sampledProjectionBytes,
    estimatedProjectionBytes,
  };
}

function chooseRecommendedNextAction(fileCount: number, hashComplete: boolean): string {
  if (fileCount === 0) {
    return "Confirm the mirror path exists, then rerun the audit.";
  }

  if (!hashComplete) {
    return "Rerun with a larger duplicate hash byte limit or inspect same-size candidates before designing retention.";
  }

  return "Review the local report, then build the conversation-only materialized view as the next non-destructive slice.";
}

function toFileSummary(file: DiscoveredFile): FileSummary {
  return {
    relativePath: file.relativePath.split(sep).join("/"),
    sizeBytes: file.sizeBytes,
    modifiedAt: file.modifiedAt,
  };
}

function increment(histogram: Record<string, number>, key: string): void {
  histogram[key] = (histogram[key] ?? 0) + 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasErrorCode(error: unknown, code: string): boolean {
  return isRecord(error) && error.code === code;
}

function renderHistogramLines(histogram: Record<string, number>): string[] {
  const entries = Object.entries(histogram).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));

  if (entries.length === 0) {
    return ["- none"];
  }

  return entries.map(([key, count]) => `- ${key}: ${count}`);
}

function renderFileLines(files: FileSummary[]): string[] {
  if (files.length === 0) {
    return ["- none"];
  }

  return files.map((file) => `- ${file.relativePath} (${file.sizeBytes} bytes, ${file.modifiedAt})`);
}

export function createTimestampedCodexSessionMirrorReportDirectory(
  baseDirectory: string,
  generatedAt: string,
): string {
  const stamp = generatedAt.replaceAll(":", "").replaceAll("-", "").replace(/\.\d{3}Z$/, "Z");
  return resolve(baseDirectory, "codex-session-mirror-storage", stamp);
}
