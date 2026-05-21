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
          type: '"chatgpt" | "claude" | "email" | "git" | "google_activity" | "google_chrome" | "icalendar" | "markdown" | "wikimedia"',
          required: true,
          description: "Source platform for the importer adapter.",
        },
        {
          name: "key",
          type: "string",
          required: true,
          description:
            "Stable source identity used to recognize the same imported record.",
        },
        {
          name: "fingerprint",
          type: "string",
          required: true,
          description:
            "Stable source content fingerprint used to detect known versus changed records.",
        },
        {
          name: "externalConversationId",
          type: "string",
          required: true,
          description:
            "Source grouping id: chat conversation, email thread, wiki page, or equivalent.",
        },
        {
          name: "externalMessageId",
          type: "string",
          required: true,
          description: "Source event/record id such as message id or revision id.",
        },
        {
          name: "artifactId",
          type: "string | null",
          required: true,
          description:
            "Stable source artifact id when the event changes a durable artifact such as a wiki page.",
        },
        {
          name: "externalParentId",
          type: "string | null",
          required: true,
          description:
            "Source graph parent id when exported; null when the source export is linear.",
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
      name: "provenance",
      purpose:
        "Where the source record comes from and whether it shares upstream lineage with other evidence.",
      fields: [
        {
          name: "sourceFamily",
          type: "string",
          required: true,
          description:
            "Broad provenance family such as personal communications, package registry, legal, or public knowledge graph.",
        },
        {
          name: "sourceName",
          type: "string",
          required: true,
          description: "Specific source such as email_mbox, wikipedia, Crossref, or npm.",
        },
        {
          name: "upstreamSources",
          type: "string[]",
          required: true,
          description:
            "Known upstream sources this record depends on before this importer saw it.",
        },
        {
          name: "derivedFrom",
          type: "string[]",
          required: true,
          description:
            "Explicit lineage markers used to avoid double-counting derived evidence.",
        },
        {
          name: "retrievedAt",
          type: "ISO datetime string | \"unknown\"",
          required: true,
          description:
            "When this source record was retrieved by the importer, or unknown for fixtures.",
        },
        {
          name: "license",
          type: "string | null",
          required: true,
          description: "Source license or null when not known/applicable.",
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
      name: "participants",
      purpose:
        "People or addresses involved in the event when the source has explicit participants.",
      fields: [
        {
          name: "role",
          type: '"sender" | "recipient" | "cc" | "bcc" | "reply_to" | "attendee" | "author"',
          required: true,
          description: "Participant's role in the source event.",
        },
        {
          name: "name",
          type: "string | null",
          required: true,
          description: "Display name from the source, or null when absent.",
        },
        {
          name: "address",
          type: "string",
          required: true,
          description: "Email address or equivalent source address.",
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
          name: "subject",
          type: "string | null",
          required: true,
          description:
            "Event subject or title when the source has one; null for chat messages.",
        },
        {
          name: "text",
          type: "string",
          required: true,
          description:
            "Normalized event body text without hiding quote/threading questions.",
        },
      ],
    },
  ],
  relations: [
    {
      from: "source.key",
      to: "source.fingerprint",
      label: "same key plus same fingerprint means known on reimport",
    },
    {
      from: "source.externalParentId",
      to: "source.canonicalParentEventId",
      label: "source id can later resolve to canonical id",
    },
    {
      from: "provenance.derivedFrom",
      to: "Evidence Weighting",
      label: "same upstream lineage must not count as independent evidence",
    },
    {
      from: "participants.address",
      to: "Identity Model",
      label: "email aliases need a later identity-resolution model",
    },
    {
      from: "content.text",
      to: "Memory Layer",
      label: "later derived, never imported directly",
    },
  ],
} satisfies EventSchema;
