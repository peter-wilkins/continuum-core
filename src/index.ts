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

export type TimeConfidence = "exact" | "inferred" | "unknown";

export type CanonicalEvent = {
  id: string;
  source: {
    platform: "chatgpt";
    externalConversationId: string;
    externalMessageId: string;
    externalParentId: string;
    canonicalParentEventId: string | null;
  };
  time: {
    createdAt: string;
    createdAtConfidence: TimeConfidence;
  };
  actor: {
    role: CanonicalActorRole;
  };
  content: {
    kind: "text";
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
        role: "user" | "assistant";
      };
      content: {
        content_type: "text";
        parts: string[];
      };
    };
  };
};

export function normalizeChatGptMessage(
  input: ChatGptMessageNormalizationInput,
): CanonicalEvent {
  return {
    id: `chatgpt:${input.conversation.id}:${input.node.message.id}`,
    source: {
      platform: "chatgpt",
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
    content: {
      kind: "text",
      text: input.node.message.content.parts.join("\n"),
    },
  };
}
