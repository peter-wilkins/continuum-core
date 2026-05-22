#!/usr/bin/env node

import { createWriteStream } from "node:fs";
import { access, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";

const defaultOutputDir = "data/audio-datasets";

const datasets = [
  {
    id: "tonalityprint-v1",
    title: "TonalityPrint v1",
    access: "direct",
    license: "CC BY-NC 4.0",
    estimatedBytes: 42_900_000,
    files: [
      {
        url: "https://zenodo.org/records/17913895/files/DATACARD.zip?download=1",
        filename: "DATACARD.zip",
      },
    ],
  },
  {
    id: "emozionalmente",
    title: "Emozionalmente",
    access: "direct",
    license: "CC BY 4.0",
    estimatedBytes: 558_900_000,
    files: [
      {
        url: "https://zenodo.org/records/12616095/files/emozionalmente.zip?download=1",
        filename: "emozionalmente.zip",
      },
    ],
  },
  {
    id: "ravdess-audio",
    title: "RAVDESS audio-only speech and song",
    access: "direct",
    license: "CC BY-NC-SA 4.0",
    estimatedBytes: 413_000_000,
    files: [
      {
        url: "https://zenodo.org/records/1188976/files/Audio_Speech_Actors_01-24.zip?download=1",
        filename: "Audio_Speech_Actors_01-24.zip",
      },
      {
        url: "https://zenodo.org/records/1188976/files/Audio_Song_Actors_01-24.zip?download=1",
        filename: "Audio_Song_Actors_01-24.zip",
      },
    ],
  },
  {
    id: "slurp-audio",
    title: "SLURP audio",
    access: "direct",
    license: "Other non-commercial",
    estimatedBytes: 6_800_000_000,
    files: [
      {
        url: "https://zenodo.org/records/4274930/files/LICENSE.txt?download=1",
        filename: "LICENSE.txt",
      },
      {
        url: "https://zenodo.org/records/4274930/files/slurp_real.tar.gz?download=1",
        filename: "slurp_real.tar.gz",
      },
      {
        url: "https://zenodo.org/records/4274930/files/slurp_synth.tar.gz?download=1",
        filename: "slurp_synth.tar.gz",
      },
    ],
  },
  {
    id: "speech-commands-v0.02",
    title: "TensorFlow Speech Commands v0.02",
    access: "direct",
    license: "CC BY 4.0",
    estimatedBytes: 2_370_000_000,
    files: [
      {
        url: "https://storage.googleapis.com/download.tensorflow.org/data/speech_commands_v0.02.tar.gz",
        filename: "speech_commands_v0.02.tar.gz",
      },
    ],
  },
  {
    id: "crema-d",
    title: "CREMA-D",
    access: "git",
    license: "ODbL 1.0",
    estimatedBytes: 1_000_000_000,
    repository: "https://github.com/CheyneyComputerScience/CREMA-D.git",
  },
  {
    id: "fluent-speech-commands",
    title: "Fluent Speech Commands",
    access: "blocked",
    license: "Conflicting: original page says academic-only; Zenodo mirror says CC BY 4.0",
    estimatedBytes: 1_500_000_000,
    reason: "Licence conflict must be resolved before product training or benchmarking.",
  },
  {
    id: "msp-podcast",
    title: "MSP-Podcast",
    access: "blocked",
    license: "Needs access and licence review",
    estimatedBytes: 409 * 60 * 60 * 16_000 * 2,
    reason: "Large naturalistic corpus; access process needs manual review.",
  },
  {
    id: "cmu-mosei",
    title: "CMU-MOSEI",
    access: "blocked",
    license: "CC-BY-NC-4.0 in audEERING card; source video provenance needs review",
    estimatedBytes: 10_000_000_000,
    reason: "No simple upstream archive URL captured yet.",
  },
  {
    id: "trustworthy-intent",
    title: "Human voices communicating trustworthy intent",
    access: "blocked",
    license: "Open-access paper; data licence/download needs verification",
    estimatedBytes: 1_000_000_000,
    reason: "Need direct data repository and licence before fetch.",
  },
  {
    id: "iemocap",
    title: "IEMOCAP",
    access: "blocked",
    license: "Access request/licence friction",
    estimatedBytes: 20_000_000_000,
    reason: "Requires access request; do not buy or register without explicit confirmation.",
  },
];

function parseArgs(args) {
  const command = {
    outputDir: defaultOutputDir,
    mode: "list",
    datasetIds: [],
    maxBytes: 20 * 1024 ** 3,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--list") {
      command.mode = "list";
      continue;
    }

    if (arg === "--direct") {
      command.mode = "direct";
      continue;
    }

    if (arg === "--dataset") {
      const datasetId = args[index + 1];
      if (!datasetId) {
        throw new Error("Usage: fetch-audio-datasets --dataset <id>");
      }
      command.mode = "selected";
      command.datasetIds.push(datasetId);
      index += 1;
      continue;
    }

    if (arg === "--out") {
      const outputDir = args[index + 1];
      if (!outputDir) {
        throw new Error("Usage: fetch-audio-datasets --out <directory>");
      }
      command.outputDir = outputDir;
      index += 1;
      continue;
    }

    if (arg === "--max-gb") {
      const maxGb = Number(args[index + 1]);
      if (!Number.isFinite(maxGb) || maxGb <= 0) {
        throw new Error("Usage: fetch-audio-datasets --max-gb <positive-number>");
      }
      command.maxBytes = maxGb * 1024 ** 3;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return command;
}

async function main() {
  const command = parseArgs(process.argv.slice(2));
  const outputDir = resolve(command.outputDir);
  await mkdir(outputDir, { recursive: true });

  if (command.mode === "list") {
    process.stdout.write(`${JSON.stringify(datasets, null, 2)}\n`);
    return;
  }

  const selected = selectDatasets(command);
  const estimatedBytes = selected.reduce(
    (total, dataset) =>
      dataset.access === "direct" || dataset.access === "git"
        ? total + dataset.estimatedBytes
        : total,
    0,
  );

  if (estimatedBytes > command.maxBytes) {
    throw new Error(
      `Selected datasets estimate ${formatBytes(estimatedBytes)}, above limit ${formatBytes(command.maxBytes)}. Raise --max-gb intentionally.`,
    );
  }

  const report = [];

  for (const dataset of selected) {
    if (dataset.access === "direct") {
      report.push(await fetchDirectDataset(outputDir, dataset));
      continue;
    }

    if (dataset.access === "git") {
      report.push(await fetchGitDataset(outputDir, dataset));
      continue;
    }

    report.push({
      id: dataset.id,
      title: dataset.title,
      status: "blocked",
      reason: dataset.reason,
      license: dataset.license,
    });
  }

  const reportPath = join(outputDir, "fetch-report.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  process.stdout.write(`Wrote dataset fetch report to ${reportPath}\n`);
}

function selectDatasets(command) {
  if (command.mode === "direct") {
    return datasets;
  }

  return command.datasetIds.map((datasetId) => {
    const dataset = datasets.find((candidate) => candidate.id === datasetId);
    if (!dataset) {
      throw new Error(`Unknown dataset id: ${datasetId}`);
    }
    return dataset;
  });
}

async function fetchDirectDataset(outputDir, dataset) {
  const datasetDir = join(outputDir, dataset.id, "downloads");
  await mkdir(datasetDir, { recursive: true });
  const files = [];

  for (const file of dataset.files) {
    const filePath = join(datasetDir, file.filename);

    if (await pathExists(filePath)) {
      files.push({
        filename: file.filename,
        status: "skipped_existing",
        path: filePath,
      });
      continue;
    }

    const tempPath = `${filePath}.part`;
    await rm(tempPath, { force: true });
    const response = await fetch(file.url);

    if (!response.ok || response.body === null) {
      throw new Error(
        `Failed to download ${dataset.id}/${file.filename}: ${response.status} ${response.statusText}`,
      );
    }

    await pipeline(Readable.fromWeb(response.body), createWriteStream(tempPath));
    await rename(tempPath, filePath);
    files.push({
      filename: file.filename,
      status: "downloaded",
      path: filePath,
    });
  }

  return {
    id: dataset.id,
    title: dataset.title,
    status: "fetched",
    license: dataset.license,
    files,
  };
}

async function fetchGitDataset(outputDir, dataset) {
  const datasetDir = join(outputDir, dataset.id, "repo");

  if (await pathExists(datasetDir)) {
    const lfsStatus = await inspectGitLfsPointerDataset(datasetDir);

    return {
      id: dataset.id,
      title: dataset.title,
      status: lfsStatus.status,
      license: dataset.license,
      path: datasetDir,
      reason: lfsStatus.reason,
    };
  }

  await mkdir(join(outputDir, dataset.id), { recursive: true });
  await run("git", ["clone", "--depth", "1", dataset.repository, datasetDir]);
  const lfsStatus = await inspectGitLfsPointerDataset(datasetDir);

  return {
    id: dataset.id,
    title: dataset.title,
    status: lfsStatus.status,
    license: dataset.license,
    path: datasetDir,
    reason: lfsStatus.reason,
  };
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function inspectGitLfsPointerDataset(datasetDir) {
  const sampleFiles = [
    join(datasetDir, "AudioWAV", "1001_TIE_ANG_XX.wav"),
    join(datasetDir, "AudioWAV", "1017_TSI_SAD_XX.wav"),
  ];

  for (const sampleFile of sampleFiles) {
    if (!(await pathExists(sampleFile))) {
      continue;
    }

    const firstBytes = await readTextPrefix(sampleFile, 64);

    if (firstBytes.startsWith("version https://git-lfs.github.com/spec/v1")) {
      return {
        status: "fetched_metadata_lfs_pending",
        reason:
          "Repository cloned, but audio files are Git LFS pointers. Install git-lfs and run git lfs pull inside the dataset repo.",
      };
    }

    return {
      status: "fetched",
      reason: "Repository cloned and sample audio file is not a Git LFS pointer.",
    };
  }

  return {
    status: "fetched",
    reason: "Repository cloned; no known Git LFS sample file was found to inspect.",
  };
}

async function readTextPrefix(path, length) {
  const file = await import("node:fs/promises");
  const handle = await file.open(path, "r");

  try {
    const buffer = Buffer.alloc(length);
    const result = await handle.read(buffer, 0, length, 0);
    return buffer.subarray(0, result.bytesRead).toString("utf8");
  } finally {
    await handle.close();
  }
}

async function run(command, args) {
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      stdio: "inherit",
    });

    child.on("error", rejectPromise);
    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

function formatBytes(bytes) {
  if (bytes < 1024 ** 2) {
    return `${Math.round(bytes / 1024)} KiB`;
  }

  if (bytes < 1024 ** 3) {
    return `${Math.round(bytes / 1024 ** 2)} MiB`;
  }

  return `${(bytes / 1024 ** 3).toFixed(1)} GiB`;
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
