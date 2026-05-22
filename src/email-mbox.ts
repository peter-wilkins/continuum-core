import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { basename } from "node:path";
import { createInterface } from "node:readline/promises";
import {
  simpleParser,
  type AddressObject,
  type HeaderValue,
  type ParsedMail,
} from "mailparser";

import type {
  EmailAddress,
  EmailMessageNormalizationInput,
  ImportErrorRecord,
} from "./index";

export type MboxParseOptions = {
  mailboxPath: string;
  collectMessages?: boolean;
};

export type MboxParseResult = {
  mailboxPath: string;
  messagesSeen: number;
  messagesParsed: number;
  messages: EmailMessageNormalizationInput[];
  quarantine: ImportErrorRecord[];
  hash: string | null;
};

type MutableMboxParseResult = MboxParseResult & {
  collectMessages: boolean;
};

export async function parseMboxText(
  raw: string,
  options: MboxParseOptions,
): Promise<MboxParseResult> {
  const result = createParseResult(options, null);
  let current: string[] = [];
  let started = false;

  for (const line of raw.replace(/\r\n/g, "\n").split("\n")) {
    if (line.startsWith("From ")) {
      if (started) {
        await parseRawMessage(current.join("\n"), result);
      }
      started = true;
      current = [];
      continue;
    }

    if (!started && line.trim() === "") {
      continue;
    }

    started = true;
    current.push(line);
  }

  if (started && current.some((line) => line.trim().length > 0)) {
    await parseRawMessage(current.join("\n"), result);
  }

  return finishParseResult(result);
}

export async function parseMboxFile(
  inputPath: string,
  options?: Partial<MboxParseOptions>,
): Promise<MboxParseResult> {
  const hash = createHash("sha256");
  const stream = createReadStream(inputPath);
  const lines = createInterface({
    input: stream,
    crlfDelay: Infinity,
  });
  const parseOptions: MboxParseOptions = {
    mailboxPath: options?.mailboxPath ?? basename(inputPath),
  };

  if (options?.collectMessages !== undefined) {
    parseOptions.collectMessages = options.collectMessages;
  }

  const result = createParseResult(parseOptions, null);
  let current: string[] = [];
  let started = false;

  stream.on("data", (chunk: Buffer) => {
    hash.update(chunk);
  });

  for await (const line of lines) {
    if (line.startsWith("From ")) {
      if (started) {
        await parseRawMessage(current.join("\n"), result);
      }
      started = true;
      current = [];
      continue;
    }

    if (!started && line.trim() === "") {
      continue;
    }

    started = true;
    current.push(line);
  }

  if (started && current.some((line) => line.trim().length > 0)) {
    await parseRawMessage(current.join("\n"), result);
  }

  result.hash = hash.digest("hex");

  return finishParseResult(result);
}

export async function inspectMboxFile(inputPath: string): Promise<MboxParseResult> {
  const hash = createHash("sha256");
  const stream = createReadStream(inputPath);
  const lines = createInterface({
    input: stream,
    crlfDelay: Infinity,
  });
  const result = createParseResult({
    mailboxPath: basename(inputPath),
    collectMessages: false,
  }, null);
  let currentHeaders: string[] = [];
  let started = false;
  let inHeaders = false;

  stream.on("data", (chunk: Buffer) => {
    hash.update(chunk);
  });

  for await (const line of lines) {
    if (line.startsWith("From ")) {
      if (started) {
        inspectRawHeaders(currentHeaders, result);
      }
      started = true;
      inHeaders = true;
      currentHeaders = [];
      continue;
    }

    if (!started && line.trim() === "") {
      continue;
    }

    if (!started) {
      started = true;
      inHeaders = true;
    }

    if (!inHeaders) {
      continue;
    }

    if (line.trim() === "") {
      inHeaders = false;
      continue;
    }

    currentHeaders.push(line);
  }

  if (started) {
    inspectRawHeaders(currentHeaders, result);
  }

  result.hash = hash.digest("hex");

  return finishParseResult(result);
}

function createParseResult(
  options: MboxParseOptions,
  hash: string | null,
): MutableMboxParseResult {
  return {
    mailboxPath: options.mailboxPath,
    messagesSeen: 0,
    messagesParsed: 0,
    messages: [],
    quarantine: [],
    hash,
    collectMessages: options.collectMessages ?? true,
  };
}

function finishParseResult(result: MutableMboxParseResult): MboxParseResult {
  return {
    mailboxPath: result.mailboxPath,
    messagesSeen: result.messagesSeen,
    messagesParsed: result.messagesParsed,
    messages: result.messages,
    quarantine: result.quarantine,
    hash: result.hash,
  };
}

async function parseRawMessage(
  rawMessage: string,
  result: MutableMboxParseResult,
): Promise<void> {
  const recordIndex = result.messagesSeen;
  result.messagesSeen += 1;

  try {
    const mail = await simpleParser(rawMessage, {
      skipImageLinks: true,
      skipTextLinks: true,
      skipTextToHtml: true,
    });
    const message = parsedMailToEmailMessage(mail, result.mailboxPath);

    result.messagesParsed += 1;
    if (result.collectMessages) {
      result.messages.push(message);
    }
  } catch (error: unknown) {
    result.quarantine.push({
      sourcePath: result.mailboxPath,
      recordIndex,
      errorCode: "email_mbox_parse_failed",
      message: error instanceof Error ? error.message : String(error),
      recoverable: true,
    });
  }
}

function inspectRawHeaders(
  headerLines: string[],
  result: MutableMboxParseResult,
): void {
  const recordIndex = result.messagesSeen;
  result.messagesSeen += 1;

  try {
    const headers = parseHeaderLines(headerLines);
    const messageId = headers.get("message-id");
    const date = headers.get("date");
    const from = headers.get("from");

    if (!messageId) {
      throw new Error("Email message is missing required Message-ID header.");
    }

    if (!date || Number.isNaN(new Date(date).getTime())) {
      throw new Error("Email message is missing a valid Date header.");
    }

    if (!from) {
      throw new Error("Email message is missing a valid From header.");
    }

    result.messagesParsed += 1;
  } catch (error: unknown) {
    result.quarantine.push({
      sourcePath: result.mailboxPath,
      recordIndex,
      errorCode: "email_mbox_parse_failed",
      message: error instanceof Error ? error.message : String(error),
      recoverable: true,
    });
  }
}

function parseHeaderLines(headerLines: string[]): Map<string, string> {
  const headers = new Map<string, string>();
  let currentKey: string | null = null;

  for (const line of headerLines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && currentKey) {
      headers.set(currentKey, `${headers.get(currentKey) ?? ""} ${line.trim()}`);
      continue;
    }

    const match = /^([^:]+):\s*(.*)$/.exec(line);
    if (!match) {
      continue;
    }

    currentKey = match[1]!.toLowerCase();
    headers.set(currentKey, match[2] ?? "");
  }

  return headers;
}

function parsedMailToEmailMessage(
  mail: ParsedMail,
  mailboxPath: string,
): EmailMessageNormalizationInput {
  if (!mail.messageId) {
    throw new Error("Email message is missing required Message-ID header.");
  }

  if (!mail.date || Number.isNaN(mail.date.getTime())) {
    throw new Error("Email message is missing a valid Date header.");
  }

  const from = firstAddress(mail.from);
  if (!from) {
    throw new Error("Email message is missing a valid From header.");
  }

  return {
    mailbox: {
      path: mailboxPath,
    },
    message: {
      messageId: mail.messageId,
      date: mail.date.toISOString(),
      from,
      to: addressesFrom(mail.to),
      cc: addressesFrom(mail.cc),
      bcc: addressesFrom(mail.bcc),
      replyTo: addressesFrom(mail.replyTo),
      subject: mail.subject ?? "",
      textBody: (mail.text ?? "").trim(),
      inReplyTo: messageIdList(mail.inReplyTo),
      references: referencesList(mail.references),
      attachmentCount: mail.attachments.length,
      headers: headersToRecord(mail),
    },
  };
}

function addressesFrom(
  input: AddressObject | AddressObject[] | undefined,
): EmailAddress[] {
  const objects = Array.isArray(input) ? input : input ? [input] : [];

  return objects.flatMap((object) =>
    object.value
      .filter((address) => Boolean(address.address))
      .map((address) => ({
        name: address.name || null,
        address: address.address ?? "",
      })),
  );
}

function firstAddress(input: AddressObject | undefined): EmailAddress | null {
  return addressesFrom(input)[0] ?? null;
}

function messageIdList(input: string | undefined): string[] {
  if (!input) {
    return [];
  }

  return input.match(/<[^>]+>|[^\s]+/g) ?? [];
}

function referencesList(input: string | string[] | undefined): string[] {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input.flatMap(messageIdList);
  }

  return messageIdList(input);
}

function headersToRecord(mail: ParsedMail): Record<string, string> {
  const headers: Record<string, string> = {};

  for (const [key, value] of mail.headers.entries()) {
    headers[key.toLowerCase()] = headerValueToString(value);
  }

  return headers;
}

function headerValueToString(value: HeaderValue): string {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(headerValueToString).join(" ");
  }

  if (isAddressObject(value)) {
    return value.text;
  }

  return JSON.stringify(value);
}

function isAddressObject(value: HeaderValue): value is AddressObject {
  return (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    Array.isArray(value.value) &&
    "text" in value
  );
}
