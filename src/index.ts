import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";
import { z } from "zod";

export const continuumCorePackageName = "@continuum/core";

export type ContinuumCorePackage = {
  name: typeof continuumCorePackageName;
};

export function describeContinuumCorePackage(): ContinuumCorePackage {
  return {
    name: continuumCorePackageName,
  };
}

export type CanonicalActorRole = "user" | "assistant" | "system" | "tool" | "other";

export type CanonicalSourcePlatform =
  | "chatgpt"
  | "claude"
  | "email"
  | "git"
  | "google_activity"
  | "google_chrome"
  | "icalendar"
  | "markdown"
  | "wikimedia";

export type CanonicalParticipantRole =
  | "sender"
  | "recipient"
  | "cc"
  | "bcc"
  | "reply_to"
  | "attendee"
  | "author";

export type CanonicalParticipant = {
  role: CanonicalParticipantRole;
  name: string | null;
  address: string;
};

export type EventProvenance = {
  sourceFamily: string;
  sourceName: string;
  upstreamSources: string[];
  derivedFrom: string[];
  retrievedAt: string;
  license: string | null;
};

export type TimeConfidence = "exact" | "inferred" | "unknown";

export type CanonicalEvent = {
  id: string;
  source: {
    platform: CanonicalSourcePlatform;
    key: string;
    fingerprint: string;
    externalConversationId: string;
    externalMessageId: string;
    artifactId: string | null;
    externalParentId: string | null;
    canonicalParentEventId: string | null;
  };
  provenance: EventProvenance;
  time: {
    createdAt: string;
    createdAtConfidence: TimeConfidence;
  };
  actor: {
    role: CanonicalActorRole;
  };
  participants: CanonicalParticipant[];
  content: {
    kind: "text";
    subject: string | null;
    text: string;
  };
};

export type ImportedEntry = {
  id: string;
  canonicalEventId: string;
  source: CanonicalEvent["source"];
  provenance: EventProvenance;
  captureContext: {
    capturedAt: string;
    contextClues: [];
  };
  time: {
    occurredAt: string;
    occurredAtConfidence: TimeConfidence;
  };
  actor: CanonicalEvent["actor"];
  participants: CanonicalParticipant[];
  content: CanonicalEvent["content"];
};

export type ResumeRequest = {
  text: string;
  requestedAt: string;
};

export type RankingSignalKind =
  | "text_overlap"
  | "recency"
  | "recurrence"
  | "explicit_resume_cue";

export type RankingSignal = {
  kind: RankingSignalKind;
  value: number;
  weight: number;
};

export type ContinuationCandidate = {
  id: string;
  title: string;
  confidence: number;
  supportingEntryIds: string[];
  rankingSignals: RankingSignal[];
};

export type ContinuityRetrievalInput = {
  resumeRequest: ResumeRequest;
  entries: ImportedEntry[];
};

export type ChatGptMessageNormalizationInput = {
  conversation: {
    id: string;
    title: string;
    create_time: number;
    update_time: number;
  };
  node: {
    id: string;
    parent: string;
    children: string[];
    message: {
      id: string;
      create_time: number;
      author: {
        role: "user" | "assistant" | "system" | "tool";
      };
      content: {
        content_type: "text";
        parts: string[];
      };
    };
  };
};

export type ChatGptConversationExport = {
  id: string;
  title: string;
  create_time: number;
  update_time: number;
  mapping: Record<string, ChatGptMessageNormalizationInput["node"]>;
};

export type ClaudeMessageNormalizationInput = {
  conversation: {
    uuid: string;
    name: string;
    created_at: string;
    updated_at: string;
  };
  message: {
    uuid: string;
    sender: "human" | "assistant";
    text: string;
    created_at: string;
    updated_at: string;
    parent_message_uuid: string | null;
    content: unknown[];
    attachments: unknown[];
    files: unknown[];
  };
};

export type ClaudeConversationExport = ClaudeMessageNormalizationInput["conversation"] & {
  summary: string | null;
  account: unknown;
  chat_messages: ClaudeMessageNormalizationInput["message"][];
};

export type SourceValidationError = {
  path: string;
  message: string;
};

export type ImportErrorRecord = {
  sourcePath: string;
  recordIndex: number | null;
  errorCode: string;
  message: string;
  recoverable: boolean;
};

export type SourceValidationResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      errors: SourceValidationError[];
    };

export type SourceQuarantineResult<T> = {
  conversations: T;
  quarantine: ImportErrorRecord[];
};

export type EmailAddress = {
  name: string | null;
  address: string;
};

export type EmailMessageNormalizationInput = {
  mailbox: {
    path: string;
  };
  message: {
    messageId: string;
    date: string;
    from: EmailAddress;
    to: EmailAddress[];
    cc: EmailAddress[];
    bcc: EmailAddress[];
    replyTo: EmailAddress[];
    subject: string;
    textBody: string;
    inReplyTo: string[];
    references: string[];
    attachmentCount: number;
    headers: Record<string, string>;
  };
};

export type GoogleChromeHistoryRecord = {
  title: string;
  url: string;
  time_usec: number;
  client_id: string;
  favicon_url: string | null;
};

export type GoogleChromeHistoryExport = {
  "Browser History": GoogleChromeHistoryRecord[];
};

export type GoogleChromeHistoryNormalizationInput = {
  history: GoogleChromeHistoryRecord;
};

export type GoogleChromeBookmarkRecord = {
  title: string;
  url: string;
  addDate: string;
  iconUri: string | null;
};

export type GoogleChromeBookmarksExport = {
  bookmarks: GoogleChromeBookmarkRecord[];
};

export type GoogleChromeReadingListExport = {
  entries: GoogleChromeBookmarkRecord[];
};

export type GoogleChromeBookmarkNormalizationInput = {
  bookmark: GoogleChromeBookmarkRecord;
};

export type GoogleMyActivityRecord = {
  header: string;
  title: string;
  titleUrl: string | null;
  subtitles: string[];
  description: string | null;
  time: string;
  products: string[];
  details: string[];
  activityControls: string[];
  locationInfos: string[];
  imageFile: string | null;
  audioFiles: string[];
  attachedFiles: string[];
};

export type GoogleMyActivityExport = GoogleMyActivityRecord[];

export type GoogleMyActivityNormalizationInput = {
  activity: GoogleMyActivityRecord;
};

export type ICalendarEventRecord = {
  uid: string;
  dtstamp: string | null;
  dtstart: string;
  dtend: string | null;
  summary: string;
  description: string | null;
  location: string | null;
  attendees: EmailAddress[];
};

export type ICalendarEventNormalizationInput = {
  calendar: {
    path: string;
  };
  event: ICalendarEventRecord;
};

export type MarkdownDocumentNormalizationInput = {
  file: {
    path: string;
    modifiedAt: string;
    modifiedAtConfidence: TimeConfidence;
  };
  content: string;
};

export type GitCommitRecord = {
  hash: string;
  authorName: string;
  authorEmail: string;
  date: string;
  subject: string;
  body: string;
  filesChanged: string[];
  statsSummary: string | null;
};

export type GitCommitNormalizationInput = {
  repository: {
    path: string;
  };
  commit: GitCommitRecord;
};

export type ImportProfile = "everything" | "clean_default" | "engaged_contacts";

export type ImportFilterAction = "include" | "exclude" | "needs_review";

export type ImportFilterReason =
  | "profile_everything"
  | "not_promotional_or_bulk"
  | "sent_by_user"
  | "replied_contact"
  | "thread_participated"
  | "promotional_or_bulk"
  | "no_prior_engagement";

export type ImportFilterDecision = {
  action: ImportFilterAction;
  reason: ImportFilterReason;
  confidence: number;
};

export type EmailEngagementIndex = {
  repliedToAddresses: Set<string>;
  participatedThreadIds: Set<string>;
};

export type ImportFilterSummary = {
  included: number;
  excluded: number;
  needsReview: number;
  reasons: Partial<Record<ImportFilterReason, number>>;
};

export type MediaWikiRevisionNormalizationInput = {
  project: string;
  page: {
    pageid: number;
    ns: number;
    title: string;
  };
  revision: {
    revid: number;
    parentid: number;
    timestamp: string;
    user: string;
    userid: number | null;
    comment: string;
    sha1: string;
    size: number;
    slots: {
      main: {
        contentmodel: string;
        contentformat: string;
        contentSha1: string;
      };
    };
  };
};

export type ImportReport = {
  new: number;
  known: number;
  changed: number;
  uncertain: number;
};

export type ImportMergeResult = {
  events: CanonicalEvent[];
  report: ImportReport;
};

export type PayloadClassification = "public" | "internal" | "private" | "secret";

export type ErasureReason = "user_request" | "retention_expired" | "policy_violation";

export type ProtectedPayload = {
  id: string;
  classification: PayloadClassification;
  createdAt: string;
  ciphertext: string;
  keyMaterial: string | null;
  erasure: {
    status: "available" | "erased";
    requestedAt: string | null;
    reason: ErasureReason | null;
  };
};

export type ProtectPayloadInput = {
  id: string;
  plaintext: string;
  classification: PayloadClassification;
  createdAt: string;
};

export type ErasureRequest = {
  requestedAt: string;
  reason: ErasureReason;
};

export type ProtectedPayloadReadResult =
  | {
      status: "available";
      plaintext: string;
    }
  | {
      status: "erased";
      plaintext: null;
    };

export type DisclosurePurpose = "export" | "prompt" | "sync" | "share";

export type MembraneDecision = {
  eventId: string;
  action: "allowed" | "blocked";
  reason: "payload_available" | "payload_erased" | "payload_missing";
  decidedAt: string;
  purpose: DisclosurePurpose;
};

export type DisclosureMembraneInput = {
  events: CanonicalEvent[];
  payloadsByEventId: Record<string, ProtectedPayload>;
  requestedAt: string;
  purpose: DisclosurePurpose;
};

export type DisclosureMembraneResult = {
  events: CanonicalEvent[];
  decisions: MembraneDecision[];
};

function provenanceKey(provenance: EventProvenance): string {
  const lineageInputs =
    provenance.derivedFrom.length > 0
      ? provenance.derivedFrom
      : provenance.upstreamSources.length > 0
        ? provenance.upstreamSources
        : [provenance.sourceName];
  const lineage = new Set(lineageInputs);

  return `${provenance.sourceFamily}:${[...lineage].sort().join("|")}`;
}

export function countIndependentEvidence(events: CanonicalEvent[]): number {
  return new Set(events.map((event) => provenanceKey(event.provenance))).size;
}

function stableHash(input: string): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= BigInt(input.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * prime);
  }

  return hash.toString(16).padStart(16, "0");
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(4))));
}

function tokenSet(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2),
  );
}

function entryRetrievalText(entry: ImportedEntry): string {
  return [entry.content.subject, entry.content.text]
    .filter((value): value is string => value !== null && value.length > 0)
    .join("\n");
}

function textOverlapScore(left: string, right: string): number {
  const leftTokens = tokenSet(left);
  const rightTokens = tokenSet(right);

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;

  return overlap / leftTokens.size;
}

function recencyScore(entry: ImportedEntry, requestedAt: string): number {
  const requested = new Date(requestedAt).getTime();
  const occurred = new Date(entry.time.occurredAt).getTime();

  if (Number.isNaN(requested) || Number.isNaN(occurred)) {
    return 0;
  }

  const ageDays = Math.max(0, (requested - occurred) / 86_400_000);

  return 1 / (1 + ageDays / 30);
}

function hasExplicitResumeCue(request: ResumeRequest): boolean {
  return /^(resume|continue|re\b|find|show|what)\b/i.test(request.text.trim());
}

function continuationTitle(entry: ImportedEntry): string {
  if (entry.content.subject !== null && entry.content.subject.trim().length > 0) {
    return entry.content.subject.trim();
  }

  return entry.content.text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 6)
    .join(" ");
}

function keyBuffer(keyMaterial: string): Buffer {
  return Buffer.from(keyMaterial, "hex");
}

function encodePayload(plaintext: string, keyMaterial: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyBuffer(keyMaterial), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

function decodePayload(ciphertext: string, keyMaterial: string): string {
  const parts = ciphertext.split(".");

  if (parts.length !== 3) {
    throw new Error("Protected payload ciphertext is malformed.");
  }

  const iv = Buffer.from(parts[0] ?? "", "base64");
  const authTag = Buffer.from(parts[1] ?? "", "base64");
  const encrypted = Buffer.from(parts[2] ?? "", "base64");
  const decipher = createDecipheriv("aes-256-gcm", keyBuffer(keyMaterial), iv);

  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8",
  );
}

export function protectPayload(input: ProtectPayloadInput): ProtectedPayload {
  const keyMaterial = randomBytes(32).toString("hex");

  return {
    id: input.id,
    classification: input.classification,
    createdAt: input.createdAt,
    ciphertext: encodePayload(input.plaintext, keyMaterial),
    keyMaterial,
    erasure: {
      status: "available",
      requestedAt: null,
      reason: null,
    },
  };
}

export function readProtectedPayload(
  payload: ProtectedPayload,
): ProtectedPayloadReadResult {
  if (payload.erasure.status === "erased" || payload.keyMaterial === null) {
    return {
      status: "erased",
      plaintext: null,
    };
  }

  return {
    status: "available",
    plaintext: decodePayload(payload.ciphertext, payload.keyMaterial),
  };
}

export function applyErasureRequest(
  payload: ProtectedPayload,
  request: ErasureRequest,
): ProtectedPayload {
  return {
    ...payload,
    keyMaterial: null,
    erasure: {
      status: "erased",
      requestedAt: request.requestedAt,
      reason: request.reason,
    },
  };
}

export function discloseThroughMembrane(
  input: DisclosureMembraneInput,
): DisclosureMembraneResult {
  const decisions: MembraneDecision[] = [];
  const events: CanonicalEvent[] = [];

  for (const event of input.events) {
    const payload = input.payloadsByEventId[event.id];

    if (!payload) {
      decisions.push({
        eventId: event.id,
        action: "blocked",
        reason: "payload_missing",
        decidedAt: input.requestedAt,
        purpose: input.purpose,
      });
      continue;
    }

    const readResult = readProtectedPayload(payload);

    if (readResult.status === "erased") {
      decisions.push({
        eventId: event.id,
        action: "blocked",
        reason: "payload_erased",
        decidedAt: input.requestedAt,
        purpose: input.purpose,
      });
      continue;
    }

    decisions.push({
      eventId: event.id,
      action: "allowed",
      reason: "payload_available",
      decidedAt: input.requestedAt,
      purpose: input.purpose,
    });
    events.push(event);
  }

  return { events, decisions };
}

const isoDatetimeSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Invalid ISO datetime",
});

const claudeMessageSchema = z
  .object({
    uuid: z.string(),
    sender: z.enum(["human", "assistant"]),
    text: z.string(),
    created_at: isoDatetimeSchema,
    updated_at: isoDatetimeSchema,
    parent_message_uuid: z.string().nullable(),
    content: z.array(z.unknown()),
    attachments: z.array(z.unknown()),
    files: z.array(z.unknown()),
  })
  .passthrough();

const claudeConversationSchema = z
  .object({
    uuid: z.string(),
    name: z.string(),
    summary: z.string().nullable(),
    created_at: isoDatetimeSchema,
    updated_at: isoDatetimeSchema,
    account: z.unknown(),
    chat_messages: z.array(claudeMessageSchema),
  })
  .passthrough();

const claudeConversationsSchema = z.array(claudeConversationSchema);

const googleChromeHistoryRecordSchema = z
  .object({
    title: z.string(),
    url: z.string(),
    time_usec: z.number(),
    client_id: z.string(),
    favicon_url: z.string().nullable(),
  })
  .passthrough();

const googleChromeHistoryExportSchema = z
  .object({
    "Browser History": z.array(googleChromeHistoryRecordSchema),
  })
  .passthrough();

const nullableStringFromMissingSchema = z.preprocess(
  (value) => value ?? null,
  z.string().nullable(),
);

const stringArrayFromMissingSchema = z.preprocess(
  (value) => {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === "string") {
      return [value];
    }

    return [];
  },
  z.array(z.string()),
);

const googleMyActivityRecordSchema = z
  .object({
    header: z.string(),
    title: z.string(),
    titleUrl: nullableStringFromMissingSchema,
    subtitles: stringArrayFromMissingSchema,
    description: nullableStringFromMissingSchema,
    time: isoDatetimeSchema,
    products: stringArrayFromMissingSchema,
    details: stringArrayFromMissingSchema,
    activityControls: stringArrayFromMissingSchema,
    locationInfos: stringArrayFromMissingSchema,
    imageFile: nullableStringFromMissingSchema,
    audioFiles: stringArrayFromMissingSchema,
    attachedFiles: stringArrayFromMissingSchema,
  })
  .passthrough();

const googleMyActivityExportSchema = z.array(googleMyActivityRecordSchema);

function validationPath(path: PropertyKey[]): string {
  return path.map(String).join(".");
}

export function parseClaudeConversations(
  input: unknown,
): SourceValidationResult<ClaudeConversationExport[]> {
  const result = claudeConversationsSchema.safeParse(input);

  if (result.success) {
    return {
      ok: true,
      value: result.data,
    };
  }

  return {
    ok: false,
    errors: result.error.issues.map((issue) => ({
      path: validationPath(issue.path),
      message: issue.message,
    })),
  };
}

export function parseClaudeConversationsWithQuarantine(
  input: unknown,
): SourceQuarantineResult<ClaudeConversationExport[]> {
  if (!Array.isArray(input)) {
    return {
      conversations: [],
      quarantine: [
        {
          sourcePath: "",
          recordIndex: null,
          errorCode: "source_validation_failed",
          message: "root: Invalid input: expected array",
          recoverable: false,
        },
      ],
    };
  }

  const conversations: ClaudeConversationExport[] = [];
  const quarantine: ImportErrorRecord[] = [];

  input.forEach((record, index) => {
    const parsed = claudeConversationSchema.safeParse(record);

    if (parsed.success) {
      conversations.push(parsed.data);
      return;
    }

    quarantine.push({
      sourcePath: String(index),
      recordIndex: index,
      errorCode: "source_validation_failed",
      message: parsed.error.issues
        .map((issue) => `${index}.${validationPath(issue.path)}: ${issue.message}`)
        .join("; "),
      recoverable: true,
    });
  });

  return { conversations, quarantine };
}

export function parseGoogleChromeHistoryExport(
  input: unknown,
): SourceValidationResult<GoogleChromeHistoryExport> {
  const result = googleChromeHistoryExportSchema.safeParse(input);

  if (result.success) {
    return {
      ok: true,
      value: result.data,
    };
  }

  return {
    ok: false,
    errors: result.error.issues.map((issue) => ({
      path: validationPath(issue.path),
      message: issue.message,
    })),
  };
}

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function parseHtmlAttributes(rawAttributes: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const attributePattern = /([A-Za-z_:-]+)="([^"]*)"/g;

  for (const match of rawAttributes.matchAll(attributePattern)) {
    const [, key, value] = match;

    if (key && value !== undefined) {
      attributes[key.toUpperCase()] = decodeHtmlEntities(value);
    }
  }

  return attributes;
}

export function parseGoogleChromeBookmarksExport(
  input: string,
): SourceValidationResult<GoogleChromeBookmarksExport> {
  const bookmarks: GoogleChromeBookmarkRecord[] = [];
  const bookmarkPattern = /<A\s+([^>]*)>(.*?)<\/A>/gis;

  for (const match of input.matchAll(bookmarkPattern)) {
    const [, rawAttributes, rawTitle] = match;
    const attributes = parseHtmlAttributes(rawAttributes ?? "");
    const url = attributes.HREF;
    const addDate = attributes.ADD_DATE;

    if (!url || !addDate) {
      continue;
    }

    bookmarks.push({
      title: decodeHtmlEntities((rawTitle ?? "").trim()),
      url,
      addDate,
      iconUri: attributes.ICON_URI ?? null,
    });
  }

  if (bookmarks.length === 0) {
    return {
      ok: false,
      errors: [
        {
          path: "bookmarks",
          message: "No bookmark links found",
        },
      ],
    };
  }

  return {
    ok: true,
    value: {
      bookmarks,
    },
  };
}

export function parseGoogleChromeReadingListExport(
  input: string,
): SourceValidationResult<GoogleChromeReadingListExport> {
  const parsed = parseGoogleChromeBookmarksExport(input);

  if (!parsed.ok) {
    return parsed;
  }

  return {
    ok: true,
    value: {
      entries: parsed.value.bookmarks,
    },
  };
}

export function parseGoogleMyActivityExport(
  input: unknown,
): SourceValidationResult<GoogleMyActivityExport> {
  const result = googleMyActivityExportSchema.safeParse(input);

  if (result.success) {
    return {
      ok: true,
      value: result.data,
    };
  }

  return {
    ok: false,
    errors: result.error.issues.map((issue) => ({
      path: validationPath(issue.path),
      message: issue.message,
    })),
  };
}

function unfoldICalendarLines(input: string): string[] {
  const lines: string[] = [];

  for (const rawLine of input.replaceAll("\r\n", "\n").split("\n")) {
    if (rawLine.startsWith(" ") || rawLine.startsWith("\t")) {
      const previous = lines.at(-1) ?? "";
      lines[lines.length - 1] = `${previous}${rawLine.slice(1)}`;
      continue;
    }

    if (rawLine.length > 0) {
      lines.push(rawLine);
    }
  }

  return lines;
}

function iCalendarPropertyName(line: string): string {
  return (line.split(":", 1)[0] ?? "").split(";", 1)[0]?.toUpperCase() ?? "";
}

function iCalendarPropertyValue(line: string): string {
  const separatorIndex = line.indexOf(":");

  if (separatorIndex === -1) {
    return "";
  }

  return line.slice(separatorIndex + 1)
    .replaceAll("\\n", "\n")
    .replaceAll("\\,", ",")
    .replaceAll("\\;", ";")
    .replaceAll("\\\\", "\\");
}

function iCalendarParameter(line: string, parameterName: string): string | null {
  const property = line.split(":", 1)[0] ?? "";
  const pattern = new RegExp(`(?:^|;)${parameterName}=([^;:]+)`, "i");
  const match = property.match(pattern);

  return match?.[1] ?? null;
}

function parseICalendarAttendee(line: string): EmailAddress {
  const rawAddress = iCalendarPropertyValue(line);
  const address = rawAddress.toLowerCase().startsWith("mailto:")
    ? rawAddress.slice("mailto:".length)
    : rawAddress;

  return {
    name: iCalendarParameter(line, "CN"),
    address,
  };
}

function requireICalendarField(
  fields: Map<string, string[]>,
  fieldName: string,
  eventIndex: number,
  errors: SourceValidationError[],
): string {
  const value = fields.get(fieldName)?.[0];

  if (!value) {
    errors.push({
      path: `VEVENT.${eventIndex}.${fieldName}`,
      message: "Required",
    });
    return "";
  }

  return value;
}

export function parseICalendarEvents(
  input: string,
): SourceValidationResult<ICalendarEventRecord[]> {
  const lines = unfoldICalendarLines(input);
  const events: ICalendarEventRecord[] = [];
  const errors: SourceValidationError[] = [];
  let currentEventLines: string[] | null = null;

  for (const line of lines) {
    if (line.toUpperCase() === "BEGIN:VEVENT") {
      currentEventLines = [];
      continue;
    }

    if (line.toUpperCase() === "END:VEVENT") {
      if (currentEventLines === null) {
        continue;
      }

      const fields = new Map<string, string[]>();
      const attendees: EmailAddress[] = [];
      const eventIndex = events.length;

      for (const eventLine of currentEventLines) {
        const propertyName = iCalendarPropertyName(eventLine);

        if (propertyName === "ATTENDEE") {
          attendees.push(parseICalendarAttendee(eventLine));
          continue;
        }

        const values = fields.get(propertyName) ?? [];
        values.push(iCalendarPropertyValue(eventLine));
        fields.set(propertyName, values);
      }

      const uid = requireICalendarField(fields, "UID", eventIndex, errors);
      const dtstart = requireICalendarField(fields, "DTSTART", eventIndex, errors);
      const summary = requireICalendarField(fields, "SUMMARY", eventIndex, errors);

      if (uid && dtstart && summary) {
        events.push({
          uid,
          dtstamp: fields.get("DTSTAMP")?.[0] ?? null,
          dtstart,
          dtend: fields.get("DTEND")?.[0] ?? null,
          summary,
          description: fields.get("DESCRIPTION")?.[0] ?? null,
          location: fields.get("LOCATION")?.[0] ?? null,
          attendees,
        });
      }

      currentEventLines = null;
      continue;
    }

    currentEventLines?.push(line);
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    value: events,
  };
}

function parseGitCommitBlock(block: string, index: number): {
  commit: GitCommitRecord | null;
  errors: SourceValidationError[];
} {
  const lines = block.split("\n");
  const hash = lines[0]?.match(/^commit\s+([0-9a-f]{7,40})$/)?.[1] ?? "";
  const authorLine = lines.find((line) => line.startsWith("Author: ")) ?? "";
  const authorMatch = authorLine.match(/^Author:\s+(.+?)\s+<([^>]+)>$/);
  const date = lines.find((line) => line.startsWith("Date: "))?.replace(/^Date:\s+/, "").trim() ?? "";
  const messageLines: string[] = [];
  const filesChanged: string[] = [];
  let statsSummary: string | null = null;
  let inMessage = false;

  for (const line of lines.slice(1)) {
    if (line.startsWith("    ")) {
      inMessage = true;
      messageLines.push(line.slice(4));
      continue;
    }

    if (inMessage && line.trim() === "") {
      continue;
    }

    if (line.includes("|")) {
      filesChanged.push((line.split("|")[0] ?? "").trim());
      continue;
    }

    if (line.match(/files? changed/)) {
      statsSummary = line.trim();
    }
  }

  const subject = messageLines[0] ?? "";
  const body = messageLines.slice(1).join("\n").trim();
  const errors: SourceValidationError[] = [];

  for (const [field, value] of [
    ["hash", hash],
    ["author", authorMatch ? "ok" : ""],
    ["date", date],
    ["subject", subject],
  ] as const) {
    if (!value) {
      errors.push({
        path: `commit.${index}.${field}`,
        message: "Required",
      });
    }
  }

  if (errors.length > 0 || !authorMatch) {
    return { commit: null, errors };
  }

  return {
    commit: {
      hash,
      authorName: authorMatch[1] ?? "",
      authorEmail: authorMatch[2] ?? "",
      date,
      subject,
      body,
      filesChanged,
      statsSummary,
    },
    errors: [],
  };
}

export function parseGitLog(
  input: string,
): SourceValidationResult<GitCommitRecord[]> {
  const trimmed = input.trim();

  if (!trimmed.startsWith("commit ")) {
    return {
      ok: false,
      errors: [
        {
          path: "commit.0.hash",
          message: "Required",
        },
      ],
    };
  }

  const blocks = trimmed.split(/\n(?=commit\s+[0-9a-f]{7,40}\n)/);
  const commits: GitCommitRecord[] = [];
  const errors: SourceValidationError[] = [];

  blocks.forEach((block, index) => {
    const parsed = parseGitCommitBlock(block, index);

    if (parsed.commit) {
      commits.push(parsed.commit);
    }

    errors.push(...parsed.errors);
  });

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    value: commits,
  };
}

function chatGptSourceKey(input: ChatGptMessageNormalizationInput): string {
  return `chatgpt:${input.conversation.id}:${input.node.message.id}`;
}

function chatGptSourceFingerprint(
  input: ChatGptMessageNormalizationInput,
): string {
  return stableHash(
    JSON.stringify({
      platform: "chatgpt",
      conversationId: input.conversation.id,
      messageId: input.node.message.id,
      parentId: input.node.parent,
      createdAt: input.node.message.create_time,
      role: input.node.message.author.role,
      contentType: input.node.message.content.content_type,
      parts: input.node.message.content.parts,
    }),
  );
}

function claudeSourceKey(input: ClaudeMessageNormalizationInput): string {
  return `claude:${input.conversation.uuid}:${input.message.uuid}`;
}

function claudeSourceFingerprint(input: ClaudeMessageNormalizationInput): string {
  return stableHash(
    JSON.stringify({
      platform: "claude",
      conversationId: input.conversation.uuid,
      messageId: input.message.uuid,
      createdAt: input.message.created_at,
      role: input.message.sender,
      text: input.message.text,
      content: input.message.content,
      attachments: input.message.attachments,
      files: input.message.files,
    }),
  );
}

function emailThreadId(input: EmailMessageNormalizationInput): string {
  return input.message.references[0] ?? input.message.messageId;
}

function emailSourceKey(input: EmailMessageNormalizationInput): string {
  return `email:${input.message.messageId}`;
}

function emailSourceFingerprint(input: EmailMessageNormalizationInput): string {
  return stableHash(
    JSON.stringify({
      platform: "email",
      mailboxPath: input.mailbox.path,
      messageId: input.message.messageId,
      date: input.message.date,
      from: input.message.from,
      to: input.message.to,
      cc: input.message.cc,
      bcc: input.message.bcc,
      replyTo: input.message.replyTo,
      subject: input.message.subject,
      textBody: input.message.textBody,
      inReplyTo: input.message.inReplyTo,
      references: input.message.references,
      attachmentCount: input.message.attachmentCount,
    }),
  );
}

function googleChromeHistoryExternalMessageId(
  input: GoogleChromeHistoryNormalizationInput,
): string {
  return `${input.history.client_id}:${input.history.time_usec}:${input.history.url}`;
}

function googleChromeHistorySourceKey(
  input: GoogleChromeHistoryNormalizationInput,
): string {
  return `google_chrome_history:${googleChromeHistoryExternalMessageId(input)}`;
}

function googleChromeHistorySourceFingerprint(
  input: GoogleChromeHistoryNormalizationInput,
): string {
  return stableHash(
    JSON.stringify({
      platform: "google_chrome",
      title: input.history.title,
      url: input.history.url,
      time_usec: input.history.time_usec,
      client_id: input.history.client_id,
      favicon_url: input.history.favicon_url,
    }),
  );
}

function googleChromeBookmarkExternalMessageId(
  input: GoogleChromeBookmarkNormalizationInput,
): string {
  return `${input.bookmark.addDate}:${input.bookmark.url}`;
}

function googleChromeBookmarkSourceKey(
  input: GoogleChromeBookmarkNormalizationInput,
): string {
  return `google_chrome_bookmark:${googleChromeBookmarkExternalMessageId(input)}`;
}

function googleChromeReadingListSourceKey(
  input: GoogleChromeBookmarkNormalizationInput,
): string {
  return `google_chrome_reading_list:${googleChromeBookmarkExternalMessageId(input)}`;
}

function googleChromeBookmarkSourceFingerprint(
  input: GoogleChromeBookmarkNormalizationInput,
): string {
  return stableHash(
    JSON.stringify({
      platform: "google_chrome",
      title: input.bookmark.title,
      url: input.bookmark.url,
      addDate: input.bookmark.addDate,
      iconUri: input.bookmark.iconUri,
    }),
  );
}

function googleChromeReadingListSourceFingerprint(
  input: GoogleChromeBookmarkNormalizationInput,
): string {
  return stableHash(
    JSON.stringify({
      platform: "google_chrome",
      title: input.bookmark.title,
      url: input.bookmark.url,
      addDate: input.bookmark.addDate,
      iconUri: input.bookmark.iconUri,
      list: "reading_list",
    }),
  );
}

function googleMyActivityExternalMessageId(
  input: GoogleMyActivityNormalizationInput,
): string {
  return `${input.activity.header}:${input.activity.time}:${input.activity.titleUrl ?? input.activity.title}`;
}

function googleMyActivitySourceKey(
  input: GoogleMyActivityNormalizationInput,
): string {
  return `google_my_activity:${googleMyActivityExternalMessageId(input)}`;
}

function googleMyActivitySourceFingerprint(
  input: GoogleMyActivityNormalizationInput,
): string {
  return stableHash(
    JSON.stringify({
      platform: "google_activity",
      header: input.activity.header,
      title: input.activity.title,
      titleUrl: input.activity.titleUrl,
      subtitles: input.activity.subtitles,
      description: input.activity.description,
      time: input.activity.time,
      products: input.activity.products,
      details: input.activity.details,
      activityControls: input.activity.activityControls,
      locationInfos: input.activity.locationInfos,
      imageFile: input.activity.imageFile,
      audioFiles: input.activity.audioFiles,
      attachedFiles: input.activity.attachedFiles,
    }),
  );
}

function iCalendarDateToIso(value: string): string {
  const match = value.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
  );

  if (!match) {
    return new Date(value).toISOString();
  }

  const [, year, month, day, hour, minute, second] = match;

  return new Date(
    `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`,
  ).toISOString();
}

function iCalendarSourceKey(input: ICalendarEventNormalizationInput): string {
  return `icalendar:${input.event.uid}`;
}

function iCalendarSourceFingerprint(
  input: ICalendarEventNormalizationInput,
): string {
  return stableHash(
    JSON.stringify({
      platform: "icalendar",
      calendarPath: input.calendar.path,
      uid: input.event.uid,
      dtstamp: input.event.dtstamp,
      dtstart: input.event.dtstart,
      dtend: input.event.dtend,
      summary: input.event.summary,
      description: input.event.description,
      location: input.event.location,
      attendees: input.event.attendees,
    }),
  );
}

function markdownSourceKey(input: MarkdownDocumentNormalizationInput): string {
  return `markdown:${input.file.path}`;
}

function markdownSourceFingerprint(
  input: MarkdownDocumentNormalizationInput,
): string {
  return stableHash(
    JSON.stringify({
      platform: "markdown",
      path: input.file.path,
      modifiedAt: input.file.modifiedAt,
      content: input.content,
    }),
  );
}

function markdownSubject(content: string, path: string): string {
  const heading = content
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("# "));

  return heading?.replace(/^#+\s*/, "") || basenameFromPath(path);
}

function basenameFromPath(path: string): string {
  return path.split(/[\\/]/).at(-1) ?? path;
}

function gitSourceKey(input: GitCommitNormalizationInput): string {
  return `git:${input.repository.path}:${input.commit.hash}`;
}

function gitSourceFingerprint(input: GitCommitNormalizationInput): string {
  return stableHash(
    JSON.stringify({
      platform: "git",
      repositoryPath: input.repository.path,
      hash: input.commit.hash,
      authorName: input.commit.authorName,
      authorEmail: input.commit.authorEmail,
      date: input.commit.date,
      subject: input.commit.subject,
      body: input.commit.body,
      filesChanged: input.commit.filesChanged,
      statsSummary: input.commit.statsSummary,
    }),
  );
}

function gitCommitText(input: GitCommitNormalizationInput): string {
  return [
    input.commit.subject,
    input.commit.body,
    input.commit.filesChanged.length > 0 ? "Files:" : null,
    ...input.commit.filesChanged,
    input.commit.statsSummary,
  ]
    .filter((value): value is string => value !== null && value.length > 0)
    .join("\n");
}

function mediaWikiArtifactId(input: MediaWikiRevisionNormalizationInput): string {
  return `${input.project}:page:${input.page.pageid}`;
}

function mediaWikiSourceKey(input: MediaWikiRevisionNormalizationInput): string {
  return `${input.project}:revision:${input.revision.revid}`;
}

function mediaWikiSourceFingerprint(
  input: MediaWikiRevisionNormalizationInput,
): string {
  return stableHash(
    JSON.stringify({
      platform: "wikimedia",
      project: input.project,
      pageid: input.page.pageid,
      ns: input.page.ns,
      title: input.page.title,
      revid: input.revision.revid,
      parentid: input.revision.parentid,
      timestamp: input.revision.timestamp,
      user: input.revision.user,
      userid: input.revision.userid,
      comment: input.revision.comment,
      sha1: input.revision.sha1,
      size: input.revision.size,
      slots: input.revision.slots,
    }),
  );
}

function normalizeClaudeSender(
  sender: ClaudeMessageNormalizationInput["message"]["sender"],
): CanonicalActorRole {
  if (sender === "human") {
    return "user";
  }

  return sender;
}

function emailParticipants(input: EmailMessageNormalizationInput): CanonicalParticipant[] {
  return [
    { role: "sender", ...input.message.from },
    ...input.message.to.map((participant) => ({
      role: "recipient" as const,
      ...participant,
    })),
    ...input.message.cc.map((participant) => ({
      role: "cc" as const,
      ...participant,
    })),
    ...input.message.bcc.map((participant) => ({
      role: "bcc" as const,
      ...participant,
    })),
    ...input.message.replyTo.map((participant) => ({
      role: "reply_to" as const,
      ...participant,
    })),
  ];
}

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

function addressSet(addresses: string[]): Set<string> {
  return new Set(addresses.map(normalizeAddress));
}

function messageAddresses(addresses: EmailAddress[]): string[] {
  return addresses.map((address) => normalizeAddress(address.address));
}

function emailThreadIds(message: EmailMessageNormalizationInput): string[] {
  return [
    ...message.message.references,
    ...message.message.inReplyTo,
    message.message.messageId,
  ];
}

function isSentByUser(
  message: EmailMessageNormalizationInput,
  myAddresses: Set<string>,
): boolean {
  return myAddresses.has(normalizeAddress(message.message.from.address));
}

function hasPromotionalSignals(message: EmailMessageNormalizationInput): boolean {
  const headers = Object.fromEntries(
    Object.entries(message.message.headers).map(([key, value]) => [
      key.toLowerCase(),
      value.toLowerCase(),
    ]),
  );
  const sender = normalizeAddress(message.message.from.address);
  const subject = message.message.subject.toLowerCase();

  return (
    "list-unsubscribe" in headers ||
    headers.precedence === "bulk" ||
    headers["auto-submitted"] === "auto-generated" ||
    sender.startsWith("noreply@") ||
    sender.startsWith("no-reply@") ||
    sender.startsWith("newsletter@") ||
    subject.includes("unsubscribe") ||
    subject.includes("offer") ||
    subject.includes("discount") ||
    subject.includes("% off")
  );
}

export function buildEmailEngagementIndex(
  messages: EmailMessageNormalizationInput[],
  myAddressesInput: string[],
): EmailEngagementIndex {
  const myAddresses = addressSet(myAddressesInput);
  const repliedToAddresses = new Set<string>();
  const participatedThreadIds = new Set<string>();

  for (const message of messages) {
    if (!isSentByUser(message, myAddresses)) {
      continue;
    }

    for (const address of [
      ...messageAddresses(message.message.to),
      ...messageAddresses(message.message.cc),
      ...messageAddresses(message.message.bcc),
    ]) {
      if (!myAddresses.has(address)) {
        repliedToAddresses.add(address);
      }
    }

    for (const threadId of emailThreadIds(message)) {
      participatedThreadIds.add(threadId);
    }
  }

  return {
    repliedToAddresses,
    participatedThreadIds,
  };
}

export function evaluateEmailImportProfile(input: {
  profile: ImportProfile;
  message: EmailMessageNormalizationInput;
  engagement: EmailEngagementIndex;
  myAddresses: string[];
}): ImportFilterDecision {
  const myAddresses = addressSet(input.myAddresses);

  if (input.profile === "everything") {
    return {
      action: "include",
      reason: "profile_everything",
      confidence: 1,
    };
  }

  if (hasPromotionalSignals(input.message)) {
    return {
      action: "exclude",
      reason: "promotional_or_bulk",
      confidence: 0.95,
    };
  }

  if (input.profile === "clean_default") {
    return {
      action: "include",
      reason: "not_promotional_or_bulk",
      confidence: 0.85,
    };
  }

  if (isSentByUser(input.message, myAddresses)) {
    return {
      action: "include",
      reason: "sent_by_user",
      confidence: 1,
    };
  }

  const sender = normalizeAddress(input.message.message.from.address);

  if (input.engagement.repliedToAddresses.has(sender)) {
    return {
      action: "include",
      reason: "replied_contact",
      confidence: 0.95,
    };
  }

  if (
    emailThreadIds(input.message).some((threadId) =>
      input.engagement.participatedThreadIds.has(threadId),
    )
  ) {
    return {
      action: "include",
      reason: "thread_participated",
      confidence: 0.9,
    };
  }

  return {
    action: "exclude",
    reason: "no_prior_engagement",
    confidence: input.profile === "engaged_contacts" ? 0.8 : 0.6,
  };
}

export function summarizeImportFilterDecisions(
  decisions: ImportFilterDecision[],
): ImportFilterSummary {
  const summary: ImportFilterSummary = {
    included: 0,
    excluded: 0,
    needsReview: 0,
    reasons: {},
  };

  for (const decision of decisions) {
    if (decision.action === "include") {
      summary.included += 1;
    } else if (decision.action === "exclude") {
      summary.excluded += 1;
    } else {
      summary.needsReview += 1;
    }

    summary.reasons[decision.reason] = (summary.reasons[decision.reason] ?? 0) + 1;
  }

  return summary;
}

export function createImportedEntryFromCanonicalEvent(
  event: CanonicalEvent,
): ImportedEntry {
  return {
    id: `entry:${event.id}`,
    canonicalEventId: event.id,
    source: event.source,
    provenance: event.provenance,
    captureContext: {
      capturedAt: event.time.createdAt,
      contextClues: [],
    },
    time: {
      occurredAt: event.time.createdAt,
      occurredAtConfidence: event.time.createdAtConfidence,
    },
    actor: event.actor,
    participants: event.participants,
    content: event.content,
  };
}

export function retrieveContinuationCandidates(
  input: ContinuityRetrievalInput,
): ContinuationCandidate[] {
  const grouped = new Map<
    string,
    {
      title: string;
      entries: ImportedEntry[];
      textOverlap: number;
      recency: number;
    }
  >();

  for (const entry of input.entries) {
    const title = continuationTitle(entry);
    const key = title.toLowerCase();
    const existing = grouped.get(key) ?? {
      title,
      entries: [],
      textOverlap: 0,
      recency: 0,
    };
    const overlap = textOverlapScore(input.resumeRequest.text, entryRetrievalText(entry));
    const recency = recencyScore(entry, input.resumeRequest.requestedAt);

    existing.entries.push(entry);
    existing.textOverlap = Math.max(existing.textOverlap, overlap);
    existing.recency = Math.max(existing.recency, recency);
    grouped.set(key, existing);
  }

  const explicitCue = hasExplicitResumeCue(input.resumeRequest) ? 1 : 0;

  return [...grouped.values()]
    .map((candidate) => {
      const recurrence = Math.min(1, candidate.entries.length / 3);
      const rankingSignals: RankingSignal[] = [
        {
          kind: "text_overlap",
          value: clampConfidence(candidate.textOverlap),
          weight: 0.5,
        },
        {
          kind: "recency",
          value: clampConfidence(candidate.recency),
          weight: 0.2,
        },
        {
          kind: "recurrence",
          value: clampConfidence(recurrence),
          weight: 0.2,
        },
        {
          kind: "explicit_resume_cue",
          value: explicitCue,
          weight: 0.1,
        },
      ];
      const confidence = clampConfidence(
        rankingSignals.reduce(
          (total, signal) => total + signal.value * signal.weight,
          0,
        ),
      );

      return {
        id: `continuation-candidate:${stableHash(candidate.title.toLowerCase())}`,
        title: candidate.title,
        confidence,
        supportingEntryIds: candidate.entries.map((entry) => entry.id),
        rankingSignals,
      };
    })
    .filter((candidate) => candidate.confidence > 0)
    .sort((left, right) => {
      if (right.confidence !== left.confidence) {
        return right.confidence - left.confidence;
      }

      return left.title.localeCompare(right.title);
    });
}

type CanonicalEventBuildInput = {
  source: CanonicalEvent["source"];
  provenance: CanonicalEvent["provenance"];
  time: CanonicalEvent["time"];
  actor: CanonicalEvent["actor"];
  participants: CanonicalEvent["participants"];
  content: CanonicalEvent["content"];
};

function buildCanonicalEvent(input: CanonicalEventBuildInput): CanonicalEvent {
  return {
    id: input.source.key,
    source: input.source,
    provenance: input.provenance,
    time: input.time,
    actor: input.actor,
    participants: input.participants,
    content: input.content,
  };
}

export function normalizeChatGptMessage(
  input: ChatGptMessageNormalizationInput,
): CanonicalEvent {
  const sourceKey = chatGptSourceKey(input);

  return buildCanonicalEvent({
    source: {
      platform: "chatgpt",
      key: sourceKey,
      fingerprint: chatGptSourceFingerprint(input),
      externalConversationId: input.conversation.id,
      externalMessageId: input.node.message.id,
      artifactId: null,
      externalParentId: input.node.parent,
      canonicalParentEventId: null,
    },
    provenance: {
      sourceFamily: "ai_chat_export",
      sourceName: "chatgpt",
      upstreamSources: [],
      derivedFrom: [],
      retrievedAt: "unknown",
      license: null,
    },
    time: {
      createdAt: new Date(input.node.message.create_time * 1000).toISOString(),
      createdAtConfidence: "exact",
    },
    actor: {
      role: input.node.message.author.role,
    },
    participants: [],
    content: {
      kind: "text",
      subject: null,
      text: input.node.message.content.parts.join("\n"),
    },
  });
}

export function normalizeClaudeMessage(
  input: ClaudeMessageNormalizationInput,
): CanonicalEvent {
  const sourceKey = claudeSourceKey(input);

  return buildCanonicalEvent({
    source: {
      platform: "claude",
      key: sourceKey,
      fingerprint: claudeSourceFingerprint(input),
      externalConversationId: input.conversation.uuid,
      externalMessageId: input.message.uuid,
      artifactId: null,
      externalParentId: input.message.parent_message_uuid,
      canonicalParentEventId: null,
    },
    provenance: {
      sourceFamily: "ai_chat_export",
      sourceName: "claude",
      upstreamSources: [],
      derivedFrom: [],
      retrievedAt: "unknown",
      license: null,
    },
    time: {
      createdAt: new Date(input.message.created_at).toISOString(),
      createdAtConfidence: "exact",
    },
    actor: {
      role: normalizeClaudeSender(input.message.sender),
    },
    participants: [],
    content: {
      kind: "text",
      subject: null,
      text: input.message.text,
    },
  });
}

export function normalizeEmailMessage(
  input: EmailMessageNormalizationInput,
): CanonicalEvent {
  const sourceKey = emailSourceKey(input);

  return buildCanonicalEvent({
    source: {
      platform: "email",
      key: sourceKey,
      fingerprint: emailSourceFingerprint(input),
      externalConversationId: emailThreadId(input),
      externalMessageId: input.message.messageId,
      artifactId: null,
      externalParentId: input.message.inReplyTo[0] ?? null,
      canonicalParentEventId: null,
    },
    provenance: {
      sourceFamily: "personal_communications",
      sourceName: "email_mbox",
      upstreamSources: [],
      derivedFrom: [],
      retrievedAt: "unknown",
      license: null,
    },
    time: {
      createdAt: new Date(input.message.date).toISOString(),
      createdAtConfidence: "exact",
    },
    actor: {
      role: "other",
    },
    participants: emailParticipants(input),
    content: {
      kind: "text",
      subject: input.message.subject,
      text: input.message.textBody,
    },
  });
}

export function normalizeGoogleChromeHistoryRecord(
  input: GoogleChromeHistoryNormalizationInput,
): CanonicalEvent {
  const sourceKey = googleChromeHistorySourceKey(input);

  return buildCanonicalEvent({
    source: {
      platform: "google_chrome",
      key: sourceKey,
      fingerprint: googleChromeHistorySourceFingerprint(input),
      externalConversationId: input.history.client_id,
      externalMessageId: googleChromeHistoryExternalMessageId(input),
      artifactId: input.history.url,
      externalParentId: null,
      canonicalParentEventId: null,
    },
    provenance: {
      sourceFamily: "activity_log",
      sourceName: "google_chrome_history",
      upstreamSources: ["google_takeout"],
      derivedFrom: [],
      retrievedAt: "unknown",
      license: null,
    },
    time: {
      createdAt: new Date(input.history.time_usec / 1000).toISOString(),
      createdAtConfidence: "exact",
    },
    actor: {
      role: "user",
    },
    participants: [],
    content: {
      kind: "text",
      subject: input.history.title,
      text: `Visited ${input.history.title}\n${input.history.url}`,
    },
  });
}

export function normalizeGoogleChromeBookmarkRecord(
  input: GoogleChromeBookmarkNormalizationInput,
): CanonicalEvent {
  const sourceKey = googleChromeBookmarkSourceKey(input);

  return buildCanonicalEvent({
    source: {
      platform: "google_chrome",
      key: sourceKey,
      fingerprint: googleChromeBookmarkSourceFingerprint(input),
      externalConversationId: "bookmarks",
      externalMessageId: googleChromeBookmarkExternalMessageId(input),
      artifactId: input.bookmark.url,
      externalParentId: null,
      canonicalParentEventId: null,
    },
    provenance: {
      sourceFamily: "saved_references",
      sourceName: "google_chrome_bookmarks",
      upstreamSources: ["google_takeout"],
      derivedFrom: [],
      retrievedAt: "unknown",
      license: null,
    },
    time: {
      createdAt: new Date(Number(input.bookmark.addDate) * 1000).toISOString(),
      createdAtConfidence: "exact",
    },
    actor: {
      role: "user",
    },
    participants: [],
    content: {
      kind: "text",
      subject: input.bookmark.title,
      text: `Bookmarked ${input.bookmark.title}\n${input.bookmark.url}`,
    },
  });
}

export function normalizeGoogleChromeReadingListRecord(
  input: GoogleChromeBookmarkNormalizationInput,
): CanonicalEvent {
  const sourceKey = googleChromeReadingListSourceKey(input);

  return buildCanonicalEvent({
    source: {
      platform: "google_chrome",
      key: sourceKey,
      fingerprint: googleChromeReadingListSourceFingerprint(input),
      externalConversationId: "reading_list",
      externalMessageId: googleChromeBookmarkExternalMessageId(input),
      artifactId: input.bookmark.url,
      externalParentId: null,
      canonicalParentEventId: null,
    },
    provenance: {
      sourceFamily: "saved_references",
      sourceName: "google_chrome_reading_list",
      upstreamSources: ["google_takeout"],
      derivedFrom: [],
      retrievedAt: "unknown",
      license: null,
    },
    time: {
      createdAt: new Date(Number(input.bookmark.addDate) * 1000).toISOString(),
      createdAtConfidence: "exact",
    },
    actor: {
      role: "user",
    },
    participants: [],
    content: {
      kind: "text",
      subject: input.bookmark.title,
      text: `Saved to reading list ${input.bookmark.title}\n${input.bookmark.url}`,
    },
  });
}

function googleMyActivityText(input: GoogleMyActivityNormalizationInput): string {
  return [
    input.activity.header,
    input.activity.title,
    input.activity.titleUrl,
    ...input.activity.subtitles,
    input.activity.description,
    ...input.activity.details,
    ...input.activity.activityControls,
    ...input.activity.locationInfos,
    input.activity.imageFile,
    ...input.activity.audioFiles,
    ...input.activity.attachedFiles,
  ]
    .filter((value): value is string => value !== null && value.length > 0)
    .join("\n");
}

export function normalizeGoogleMyActivityRecord(
  input: GoogleMyActivityNormalizationInput,
): CanonicalEvent {
  const sourceKey = googleMyActivitySourceKey(input);

  return buildCanonicalEvent({
    source: {
      platform: "google_activity",
      key: sourceKey,
      fingerprint: googleMyActivitySourceFingerprint(input),
      externalConversationId: input.activity.header,
      externalMessageId: googleMyActivityExternalMessageId(input),
      artifactId: input.activity.titleUrl,
      externalParentId: null,
      canonicalParentEventId: null,
    },
    provenance: {
      sourceFamily: "activity_log",
      sourceName: "google_my_activity",
      upstreamSources: ["google_takeout"],
      derivedFrom: [],
      retrievedAt: "unknown",
      license: null,
    },
    time: {
      createdAt: new Date(input.activity.time).toISOString(),
      createdAtConfidence: "exact",
    },
    actor: {
      role: "user",
    },
    participants: [],
    content: {
      kind: "text",
      subject: input.activity.title,
      text: googleMyActivityText(input),
    },
  });
}

export function normalizeICalendarEvent(
  input: ICalendarEventNormalizationInput,
): CanonicalEvent {
  const sourceKey = iCalendarSourceKey(input);
  const textParts = [
    input.event.summary,
    input.event.description,
    input.event.location === null ? null : `Location: ${input.event.location}`,
    input.event.dtend === null
      ? null
      : `Ends: ${iCalendarDateToIso(input.event.dtend)}`,
  ];

  return buildCanonicalEvent({
    source: {
      platform: "icalendar",
      key: sourceKey,
      fingerprint: iCalendarSourceFingerprint(input),
      externalConversationId: input.calendar.path,
      externalMessageId: input.event.uid,
      artifactId: input.event.uid,
      externalParentId: null,
      canonicalParentEventId: null,
    },
    provenance: {
      sourceFamily: "personal_schedule",
      sourceName: "icalendar",
      upstreamSources: [],
      derivedFrom: [],
      retrievedAt: "unknown",
      license: null,
    },
    time: {
      createdAt: iCalendarDateToIso(input.event.dtstart),
      createdAtConfidence: "exact",
    },
    actor: {
      role: "other",
    },
    participants: input.event.attendees.map((attendee) => ({
      role: "attendee",
      ...attendee,
    })),
    content: {
      kind: "text",
      subject: input.event.summary,
      text: textParts
        .filter((value): value is string => value !== null && value.length > 0)
        .join("\n"),
    },
  });
}

export function normalizeMarkdownDocument(
  input: MarkdownDocumentNormalizationInput,
): CanonicalEvent {
  const sourceKey = markdownSourceKey(input);

  return buildCanonicalEvent({
    source: {
      platform: "markdown",
      key: sourceKey,
      fingerprint: markdownSourceFingerprint(input),
      externalConversationId: input.file.path,
      externalMessageId: input.file.path,
      artifactId: input.file.path,
      externalParentId: null,
      canonicalParentEventId: null,
    },
    provenance: {
      sourceFamily: "local_documents",
      sourceName: "markdown",
      upstreamSources: [],
      derivedFrom: [],
      retrievedAt: "unknown",
      license: null,
    },
    time: {
      createdAt: new Date(input.file.modifiedAt).toISOString(),
      createdAtConfidence: input.file.modifiedAtConfidence,
    },
    actor: {
      role: "other",
    },
    participants: [],
    content: {
      kind: "text",
      subject: markdownSubject(input.content, input.file.path),
      text: input.content.trim(),
    },
  });
}

export function normalizeGitCommit(
  input: GitCommitNormalizationInput,
): CanonicalEvent {
  const sourceKey = gitSourceKey(input);

  return buildCanonicalEvent({
    source: {
      platform: "git",
      key: sourceKey,
      fingerprint: gitSourceFingerprint(input),
      externalConversationId: input.repository.path,
      externalMessageId: input.commit.hash,
      artifactId: input.repository.path,
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
      createdAt: new Date(input.commit.date).toISOString(),
      createdAtConfidence: "exact",
    },
    actor: {
      role: "user",
    },
    participants: [
      {
        role: "author",
        name: input.commit.authorName,
        address: input.commit.authorEmail,
      },
    ],
    content: {
      kind: "text",
      subject: input.commit.subject,
      text: gitCommitText(input),
    },
  });
}

export function normalizeMediaWikiRevision(
  input: MediaWikiRevisionNormalizationInput,
): CanonicalEvent {
  const sourceKey = mediaWikiSourceKey(input);

  return buildCanonicalEvent({
    source: {
      platform: "wikimedia",
      key: sourceKey,
      fingerprint: mediaWikiSourceFingerprint(input),
      externalConversationId: mediaWikiArtifactId(input),
      externalMessageId: String(input.revision.revid),
      artifactId: mediaWikiArtifactId(input),
      externalParentId:
        input.revision.parentid === 0 ? null : String(input.revision.parentid),
      canonicalParentEventId: null,
    },
    provenance: {
      sourceFamily: "public_knowledge_graph",
      sourceName: "wikipedia",
      upstreamSources: [],
      derivedFrom: ["wikipedia"],
      retrievedAt: "unknown",
      license: "CC-BY-SA",
    },
    time: {
      createdAt: new Date(input.revision.timestamp).toISOString(),
      createdAtConfidence: "exact",
    },
    actor: {
      role: "other",
    },
    participants: [],
    content: {
      kind: "text",
      subject: input.page.title,
      text: input.revision.comment,
    },
  });
}

export function normalizeChatGptConversations(
  conversations: ChatGptConversationExport[],
): CanonicalEvent[] {
  return conversations.flatMap((conversation) =>
    Object.values(conversation.mapping)
      .filter((node) => node.message)
      .map((node) =>
        normalizeChatGptMessage({
          conversation,
          node,
        }),
      ),
  );
}

export function normalizeClaudeConversations(
  conversations: ClaudeConversationExport[],
): CanonicalEvent[] {
  return conversations.flatMap((conversation) =>
    conversation.chat_messages.map((message) =>
      normalizeClaudeMessage({
        conversation,
        message,
      }),
    ),
  );
}

export function normalizeGoogleChromeHistoryExport(
  historyExport: GoogleChromeHistoryExport,
): CanonicalEvent[] {
  return historyExport["Browser History"].map((history) =>
    normalizeGoogleChromeHistoryRecord({ history }),
  );
}

export function normalizeGoogleChromeBookmarksExport(
  bookmarksExport: GoogleChromeBookmarksExport,
): CanonicalEvent[] {
  return bookmarksExport.bookmarks.map((bookmark) =>
    normalizeGoogleChromeBookmarkRecord({ bookmark }),
  );
}

export function normalizeGoogleChromeReadingListExport(
  readingListExport: GoogleChromeReadingListExport,
): CanonicalEvent[] {
  return readingListExport.entries.map((bookmark) =>
    normalizeGoogleChromeReadingListRecord({ bookmark }),
  );
}

export function normalizeGoogleMyActivityExport(
  activityExport: GoogleMyActivityExport,
): CanonicalEvent[] {
  return activityExport.map((activity) =>
    normalizeGoogleMyActivityRecord({ activity }),
  );
}

function groupBySourceKey(events: CanonicalEvent[]): Map<string, CanonicalEvent[]> {
  const grouped = new Map<string, CanonicalEvent[]>();

  for (const event of events) {
    const existing = grouped.get(event.source.key) ?? [];
    existing.push(event);
    grouped.set(event.source.key, existing);
  }

  return grouped;
}

function hasMultipleFingerprints(events: CanonicalEvent[]): boolean {
  return new Set(events.map((event) => event.source.fingerprint)).size > 1;
}

export function mergeCanonicalEvents(
  existingEvents: CanonicalEvent[],
  incomingEvents: CanonicalEvent[],
): ImportMergeResult {
  const events = [...existingEvents];
  const report: ImportReport = {
    new: 0,
    known: 0,
    changed: 0,
    uncertain: 0,
  };
  const existingBySourceKey = groupBySourceKey(existingEvents);
  const incomingBySourceKey = groupBySourceKey(incomingEvents);

  for (const incomingGroup of incomingBySourceKey.values()) {
    const incomingEvent = incomingGroup[0];

    if (!incomingEvent || hasMultipleFingerprints(incomingGroup)) {
      report.uncertain += incomingGroup.length;
      continue;
    }

    const existingGroup = existingBySourceKey.get(incomingEvent.source.key);

    if (!existingGroup) {
      events.push(incomingEvent);
      existingBySourceKey.set(incomingEvent.source.key, [incomingEvent]);
      report.new += 1;
      report.known += incomingGroup.length - 1;
      continue;
    }

    if (hasMultipleFingerprints(existingGroup)) {
      report.uncertain += incomingGroup.length;
      continue;
    }

    const existingEvent = existingGroup[0];

    if (existingEvent?.source.fingerprint === incomingEvent.source.fingerprint) {
      report.known += incomingGroup.length;
      continue;
    }

    report.changed += incomingGroup.length;
  }

  return { events, report };
}
