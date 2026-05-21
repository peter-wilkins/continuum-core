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

export type CanonicalSourcePlatform = "chatgpt" | "claude" | "email";

export type CanonicalParticipantRole = "sender" | "recipient" | "cc" | "bcc" | "reply_to";

export type CanonicalParticipant = {
  role: CanonicalParticipantRole;
  name: string | null;
  address: string;
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
    externalParentId: string | null;
    canonicalParentEventId: string | null;
  };
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
    content: unknown[];
    attachments: unknown[];
    files: unknown[];
  };
};

export type ClaudeConversationExport = ClaudeMessageNormalizationInput["conversation"] & {
  chat_messages: ClaudeMessageNormalizationInput["message"][];
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

function stableHash(input: string): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= BigInt(input.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * prime);
  }

  return hash.toString(16).padStart(16, "0");
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
      externalParentId: input.node.parent,
      canonicalParentEventId: null,
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
      externalParentId: null,
      canonicalParentEventId: null,
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
      externalParentId: input.message.inReplyTo[0] ?? null,
      canonicalParentEventId: null,
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
