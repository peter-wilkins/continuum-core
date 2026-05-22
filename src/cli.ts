#!/usr/bin/env node

import {
  importCommands,
  isImportCommand,
  type ImportCommand,
} from "./import-source-adapters";
import {
  runImportCommand,
  type ContinuumImportCliResult,
  type ImportRunnerCommand,
} from "./import-runner";

const importCommandUsage = importCommands.join("|");

function parseCliCommand(args: string[]): ImportRunnerCommand {
  const [command, inputPath, outFlag, outputPath] = args;

  if (
    !isImportCommand(command) ||
    !inputPath ||
    outFlag !== "--out" ||
    !outputPath
  ) {
    throw new Error(
      `Usage: continuum-import <${importCommandUsage}> <source-file> --out <events.jsonl>`,
    );
  }

  return { kind: "import", source: command, inputPath, outputPath };
}

function parseInspectCommand(args: string[]): ImportRunnerCommand {
  const [, source, inputPath] = args;

  if (!isImportCommand(source) || !inputPath) {
    throw new Error(`Usage: continuum-import inspect <${importCommandUsage}> <source-file>`);
  }

  return { kind: "inspect", source, inputPath };
}

function parseDryRunCommand(args: string[]): ImportRunnerCommand {
  const [, source, inputPath, ...flags] = args;

  if (
    !isImportCommand(source) ||
    !inputPath
  ) {
    throw new Error(
      `Usage: continuum-import dry-run <${importCommandUsage}> <source-file> [--scope <scope.json>] [--my-address <email>] --out <preview.json>`,
    );
  }

  let importScopePath: string | null = null;
  let previewPath: string | null = null;
  const myAddresses: string[] = [];

  for (let index = 0; index < flags.length; index += 2) {
    const flag = flags[index];
    const value = flags[index + 1];

    if (!flag || !value) {
      throw new Error(
        `Usage: continuum-import dry-run <${importCommandUsage}> <source-file> [--scope <scope.json>] [--my-address <email>] --out <preview.json>`,
      );
    }

    if (flag === "--scope") {
      importScopePath = value;
      continue;
    }

    if (flag === "--my-address") {
      myAddresses.push(value);
      continue;
    }

    if (flag === "--out") {
      previewPath = value;
      continue;
    }

    throw new Error(
      `Usage: continuum-import dry-run <${importCommandUsage}> <source-file> [--scope <scope.json>] [--my-address <email>] --out <preview.json>`,
    );
  }

  if (previewPath !== null) {
    return {
      kind: "dry-run",
      source,
      inputPath,
      importScopePath,
      myAddresses,
      previewPath,
    };
  }

  throw new Error(
    `Usage: continuum-import dry-run <${importCommandUsage}> <source-file> [--scope <scope.json>] [--my-address <email>] --out <preview.json>`,
  );
}

function parseCommand(args: string[]): ImportRunnerCommand {
  if (args[0] === "inspect") {
    return parseInspectCommand(args);
  }

  if (args[0] === "dry-run") {
    return parseDryRunCommand(args);
  }

  return parseCliCommand(args);
}

export async function runContinuumImportCli(
  args: string[],
): Promise<ContinuumImportCliResult> {
  return runImportCommand(parseCommand(args));
}

export function formatContinuumImportCliResult(
  result: ContinuumImportCliResult,
): string {
  if (result.command === "inspect") {
    return `Detected ${result.sourcePlatform} conversations=${result.conversationsSeen} records=${result.recordsSeen} importable=${result.importableEvents} validationErrors=${result.validationErrors} warnings=${result.warnings} sourceFiles=${result.sourceFiles.length}\n`;
  }

  if (result.command === "dry-run") {
    return [
      `Preview written to ${result.previewPath}`,
      `Report new=${result.report.new} known=${result.report.known} changed=${result.report.changed} uncertain=${result.report.uncertain} quarantined=${result.quarantine.length} warnings=${result.batch.stats.warnings} sourceFiles=${result.batch.stats.filesSeen} included=${result.filterSummary.included} excluded=${result.filterSummary.excluded} needsReview=${result.filterSummary.needsReview}`,
    ].join("\n") + "\n";
  }

  return [
    `Wrote ${result.eventsWritten} new events to ${result.outputPath}`,
    `Report new=${result.report.new} known=${result.report.known} changed=${result.report.changed} uncertain=${result.report.uncertain} quarantined=${result.quarantine.length} warnings=${result.warnings}`,
  ].join("\n") + "\n";
}

export type { ContinuumImportCliResult, ImportCommand };

if (import.meta.url === `file://${process.argv[1]}`) {
  runContinuumImportCli(process.argv.slice(2))
    .then((result) => {
      process.stdout.write(formatContinuumImportCliResult(result));
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    });
}
