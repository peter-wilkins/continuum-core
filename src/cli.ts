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
  const [, source, inputPath, outFlag, previewPath] = args;

  if (
    !isImportCommand(source) ||
    !inputPath ||
    outFlag !== "--out" ||
    !previewPath
  ) {
    throw new Error(
      `Usage: continuum-import dry-run <${importCommandUsage}> <source-file> --out <preview.json>`,
    );
  }

  return { kind: "dry-run", source, inputPath, previewPath };
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
      `Report new=${result.report.new} known=${result.report.known} changed=${result.report.changed} uncertain=${result.report.uncertain} quarantined=${result.quarantine.length} warnings=${result.batch.stats.warnings} sourceFiles=${result.batch.stats.filesSeen}`,
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
