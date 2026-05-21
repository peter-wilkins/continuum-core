export type SchemaField = {
  name: string;
  type: string;
  required: boolean;
  description: string;
};

export type SchemaSection = {
  name: string;
  purpose: string;
  fields: SchemaField[];
};

export type SchemaRelation = {
  from: string;
  to: string;
  label: string;
};

export type EventSchema = {
  name: string;
  purpose: string;
  sections: SchemaSection[];
  relations: SchemaRelation[];
};

export const canonicalEventSchema = {
  name: "CanonicalEvent",
  purpose:
    "One immutable normalized event in Continuum's unified event model.",
  sections: [
    {
      name: "source",
      purpose: "Where this event came from and how to trace it back.",
      fields: [
        {
          name: "platform",
          type: '"chatgpt"',
          required: true,
          description: "Source platform for this first importer slice.",
        },
        {
          name: "externalConversationId",
          type: "string",
          required: true,
          description: "ChatGPT conversation id.",
        },
        {
          name: "externalMessageId",
          type: "string",
          required: true,
          description: "ChatGPT message id.",
        },
        {
          name: "externalParentId",
          type: "string",
          required: true,
          description: "Source graph parent id from ChatGPT.",
        },
        {
          name: "canonicalParentEventId",
          type: "string | null",
          required: true,
          description:
            "Canonical parent event id once linked; null while only the source parent id is known.",
        },
      ],
    },
    {
      name: "time",
      purpose: "When the source says the event happened.",
      fields: [
        {
          name: "createdAt",
          type: "ISO datetime string",
          required: true,
          description: "Message creation time normalized to UTC ISO format.",
        },
        {
          name: "createdAtConfidence",
          type: '"exact" | "inferred" | "unknown"',
          required: true,
          description: "How much we trust the createdAt value.",
        },
      ],
    },
    {
      name: "actor",
      purpose: "Who or what produced the event.",
      fields: [
        {
          name: "role",
          type: '"user" | "assistant" | "system" | "tool" | "other"',
          required: true,
          description: "Normalized actor role.",
        },
      ],
    },
    {
      name: "content",
      purpose: "The normalized payload that can later feed memory/retrieval.",
      fields: [
        {
          name: "kind",
          type: '"text"',
          required: true,
          description: "Content kind supported by the first importer slice.",
        },
        {
          name: "text",
          type: "string",
          required: true,
          description: "Normalized message text.",
        },
      ],
    },
  ],
  relations: [
    {
      from: "source.externalParentId",
      to: "source.canonicalParentEventId",
      label: "source id can later resolve to canonical id",
    },
    {
      from: "content.text",
      to: "Memory Layer",
      label: "later derived, never imported directly",
    },
  ],
} satisfies EventSchema;
