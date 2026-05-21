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

export type CanonicalSourcePlatform = "chatgpt" | "claude" | "email" | "wikimedia";

export type CanonicalParticipantRole = "sender" | "recipient" | "cc" | "bcc" | "reply_to";

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

export type SourceValidationResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      errors: SourceValidationError[];
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
  };
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

export function normalizeChatGptMessage(
  input: ChatGptMessageNormalizationInput,
): CanonicalEvent {
  const sourceKey = chatGptSourceKey(input);

  return {
    id: sourceKey,
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
  };
}

export function normalizeClaudeMessage(
  input: ClaudeMessageNormalizationInput,
): CanonicalEvent {
  const sourceKey = claudeSourceKey(input);

  return {
    id: sourceKey,
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
  };
}

export function normalizeEmailMessage(
  input: EmailMessageNormalizationInput,
): CanonicalEvent {
  const sourceKey = emailSourceKey(input);

  return {
    id: sourceKey,
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
  };
}

export function normalizeMediaWikiRevision(
  input: MediaWikiRevisionNormalizationInput,
): CanonicalEvent {
  const sourceKey = mediaWikiSourceKey(input);

  return {
    id: sourceKey,
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
  };
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
