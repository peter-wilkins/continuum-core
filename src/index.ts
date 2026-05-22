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

type Brand<T, BrandName extends string> = T & {
  readonly __brand: BrandName;
};

export type CanonicalEventId = Brand<string, "CanonicalEventId">;
export type Confidence = Brand<number, "Confidence">;
export type HumanText = Brand<string, "HumanText">;
export type KnowledgeTime = Brand<string, "KnowledgeTime">;
export type LensOutputId = Brand<string, "LensOutputId">;
export type NonEmptyArray<T> = [T, ...T[]];
export type ParserVersion = Brand<string, "ParserVersion">;
export type ParagraphIndex = Brand<number, "ParagraphIndex">;
export type SourceDocumentId = Brand<string, "SourceDocumentId">;
export type SourceFingerprint = Brand<string, "SourceFingerprint">;
export type SourceName = Brand<string, "SourceName">;
export type SourceParagraphId = Brand<string, "SourceParagraphId">;
export type SourceRecordId = Brand<string, "SourceRecordId">;
export type SourceUrl = Brand<string, "SourceUrl">;
export type ThoughtCardId = Brand<string, "ThoughtCardId">;

export function describeContinuumCorePackage(): ContinuumCorePackage {
  return {
    name: continuumCorePackageName,
  };
}

export function createImportScope(input: ImportScope): ImportScope {
  validateImportScope(input);

  return input;
}

export function importScopeTitle(scope: ImportScope): string {
  if (scope.focusEntity === null) {
    return scope.primaryEntity.label;
  }

  return `${scope.primaryEntity.label} through ${scope.focusEntity.label}`;
}

function validateImportScope(scope: ImportScope): void {
  if (scope.id.trim().length === 0) {
    throw new Error("ImportScope id must not be blank.");
  }

  validateImportScopeEntity("primaryEntity", scope.primaryEntity);

  if (scope.focusEntity !== null) {
    validateImportScopeEntity("focusEntity", scope.focusEntity);
  }

  if (scope.sourceFamilies.length === 0) {
    throw new Error("ImportScope sourceFamilies must contain at least one source family.");
  }

  if (Number.isNaN(new Date(scope.createdAt).getTime())) {
    throw new Error("ImportScope createdAt must be an ISO-compatible date.");
  }
}

function validateImportScopeEntity(
  fieldName: "primaryEntity" | "focusEntity",
  entity: ImportScopeEntity,
): void {
  if (entity.label.trim().length === 0) {
    throw new Error(`ImportScope ${fieldName}.label must not be blank.`);
  }

  for (const sourceId of entity.sourceIds) {
    if (sourceId.id.trim().length === 0) {
      throw new Error(`ImportScope ${fieldName}.sourceIds.id must not be blank.`);
    }
  }
}

export type CanonicalActorRole = "user" | "assistant" | "system" | "tool" | "other";

export type CanonicalSourcePlatform =
  | "chatgpt"
  | "claude"
  | "email"
  | "git"
  | "github"
  | "google_activity"
  | "google_chrome"
  | "icalendar"
  | "markdown"
  | "public_archive"
  | "wikimedia";

export type CanonicalParticipantRole =
  | "sender"
  | "recipient"
  | "cc"
  | "bcc"
  | "reply_to"
  | "attendee"
  | "author"
  | "translator"
  | "editor";

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

export type ImportScopeSourceFamily =
  | "wikimedia"
  | "github_public"
  | "public_archive"
  | "scholarly_metadata";

export type ImportScopeEntityKind =
  | "person"
  | "topic"
  | "work"
  | "organization"
  | "place"
  | "event"
  | "concept";

export type ImportScopeEntitySourceId = {
  sourceFamily: ImportScopeSourceFamily;
  id: string;
  url: string | null;
};

export type ImportScopeEntity = {
  kind: ImportScopeEntityKind;
  label: string;
  aliases: string[];
  sourceIds: ImportScopeEntitySourceId[];
};

export type ImportScope = {
  id: string;
  primaryEntity: ImportScopeEntity;
  focusEntity: ImportScopeEntity | null;
  sourceFamilies: ImportScopeSourceFamily[];
  publicness: {
    access: "public_only";
    licenseIntent: "respect_source_license" | "public_domain_or_open_license";
  };
  provenancePolicy: {
    sourceFamiliesCountAsIndependentEvidence: boolean;
  };
  createdAt: string;
};

export type PublicContinuumQuery = {
  id: string;
  scopeId: string;
  text: string;
  origin: "system_seed" | "user";
  createdAt: string;
};

export type PublicScopeEventDecision = {
  action: "include" | "needs_review" | "exclude";
  reason:
    | "primary_and_focus_match"
    | "primary_match_focus_uncertain"
    | "primary_identity_missing"
    | "source_family_not_allowed";
  confidence: number;
  matchedTerms: string[];
};

export function createPublicContinuumQuery(
  scope: ImportScope,
  query: PublicContinuumQuery,
): PublicContinuumQuery {
  validatePublicContinuumQuery(scope, query);

  return query;
}

function validatePublicContinuumQuery(
  scope: ImportScope,
  query: PublicContinuumQuery,
): void {
  validateNonBlank("PublicContinuumQuery id", query.id);
  validateNonBlank("PublicContinuumQuery scopeId", query.scopeId);
  validateNonBlank("PublicContinuumQuery text", query.text);

  if (query.scopeId !== scope.id) {
    throw new Error("PublicContinuumQuery scopeId must match the ImportScope id.");
  }

  if (Number.isNaN(new Date(query.createdAt).getTime())) {
    throw new Error(
      "PublicContinuumQuery createdAt must be an ISO-compatible date.",
    );
  }
}

export function evaluatePublicScopeEvent(
  scope: ImportScope,
  event: CanonicalEvent,
): PublicScopeEventDecision {
  const primaryMatches = matchedIdentityTerms(scope.primaryEntity, event);
  const focusMatches =
    scope.focusEntity === null ? [] : matchedIdentityTerms(scope.focusEntity, event);
  const matchedTerms = [...primaryMatches, ...focusMatches];

  if (
    !scope.sourceFamilies.some(
      (sourceFamily) => sourceFamily === event.provenance.sourceFamily,
    )
  ) {
    return {
      action: "exclude",
      reason: "source_family_not_allowed",
      confidence: 1,
      matchedTerms,
    };
  }

  if (primaryMatches.length === 0) {
    return {
      action: "exclude",
      reason: "primary_identity_missing",
      confidence: 0.9,
      matchedTerms: [],
    };
  }

  if (scope.focusEntity === null || focusMatches.length > 0) {
    return {
      action: "include",
      reason: "primary_and_focus_match",
      confidence: 1,
      matchedTerms,
    };
  }

  return {
    action: "needs_review",
    reason: "primary_match_focus_uncertain",
    confidence: 0.65,
    matchedTerms,
  };
}

function matchedIdentityTerms(
  identity: ImportScopeEntity,
  event: CanonicalEvent,
): string[] {
  const terms = [
    identity.label,
    ...identity.aliases,
    ...identity.sourceIds.map((sourceId) => sourceId.id),
  ];
  const searchable = canonicalEventSearchText(event);
  const matched: string[] = [];

  for (const term of terms) {
    if (
      term.trim().length > 0 &&
      searchable.includes(term.toLocaleLowerCase()) &&
      !matched.includes(term)
    ) {
      matched.push(term);
    }
  }

  return matched;
}

function canonicalEventSearchText(event: CanonicalEvent): string {
  return [
    event.id,
    event.source.key,
    event.source.externalConversationId,
    event.source.externalMessageId,
    event.source.artifactId,
    event.content.subject,
    event.content.text,
    ...event.participants.flatMap((participant) => [
      participant.name,
      participant.address,
    ]),
  ]
    .filter((value): value is string => value !== null)
    .join("\n")
    .toLocaleLowerCase();
}

export type LensDefinition = {
  id: string;
  name: string;
  version: string;
  userBlurb: string;
  technicalBlurb: string;
};

export type LensGenerationParameter = {
  key: string;
  value: string;
};

export type LensOutputSection = {
  id: string;
  title: string;
  eventIds: string[];
};

export type LensOutput = {
  id: string;
  scopeId: string;
  queryId: string;
  lensId: string;
  lensVersion: string;
  generatedAt: string;
  sourceEventIds: string[];
  sections: LensOutputSection[];
  generation: {
    strategy: string;
    model: string | null;
    parameters: LensGenerationParameter[];
  };
};

export type LensFeedbackSignal = {
  id: string;
  userId: string;
  scopeId: string;
  queryId: string;
  selectedLensOutputId: string;
  candidateLensOutputIds: string[];
  signal: "preferred";
  createdAt: string;
};

export type SourceParagraphContext = {
  title: HumanText;
  sourceName: SourceName;
  sourceRecordId: SourceRecordId;
  sourceUrl: SourceUrl;
  license: HumanText;
  retrievedAt: KnowledgeTime;
  parserVersion: ParserVersion;
};

export type SourceParagraph = {
  id: SourceParagraphId;
  canonicalEventId: CanonicalEventId;
  documentId: SourceDocumentId;
  paragraphIndex: ParagraphIndex;
  sourceFingerprint: SourceFingerprint;
  text: HumanText;
  context: SourceParagraphContext;
};

export type SourceParagraphInput = {
  id: string;
  canonicalEventId: string;
  documentId: string;
  paragraphIndex: number;
  sourceFingerprint: string;
  text: string;
  context: {
    title: string;
    sourceName: string;
    sourceRecordId: string;
    sourceUrl: string;
    license: string;
    retrievedAt: string;
    parserVersion: string;
  };
};

export type ThoughtCard = {
  id: ThoughtCardId;
  lensOutputId: LensOutputId;
  title: HumanText;
  body: HumanText;
  sourceParagraphIds: NonEmptyArray<SourceParagraphId>;
  confidence: Confidence;
  generatedAt: KnowledgeTime;
};

export type ThoughtCardInput = {
  id: string;
  lensOutputId: string;
  title: string;
  body: string;
  sourceParagraphIds: string[];
  confidence: number;
  generatedAt: string;
};

export function createSourceParagraph(
  input: SourceParagraphInput,
): SourceParagraph {
  return {
    id: sourceParagraphId(input.id),
    canonicalEventId: canonicalEventId(input.canonicalEventId),
    documentId: sourceDocumentId(input.documentId),
    paragraphIndex: paragraphIndex(input.paragraphIndex),
    sourceFingerprint: sourceFingerprint(input.sourceFingerprint),
    text: humanText("SourceParagraph text", input.text),
    context: {
      title: humanText("SourceParagraph context.title", input.context.title),
      sourceName: sourceName(input.context.sourceName),
      sourceRecordId: sourceRecordId(input.context.sourceRecordId),
      sourceUrl: sourceUrl(input.context.sourceUrl),
      license: humanText("SourceParagraph context.license", input.context.license),
      retrievedAt: knowledgeTime(
        "SourceParagraph context.retrievedAt",
        input.context.retrievedAt,
      ),
      parserVersion: parserVersion(input.context.parserVersion),
    },
  };
}

export function createThoughtCard(input: ThoughtCardInput): ThoughtCard {
  return {
    id: thoughtCardId(input.id),
    lensOutputId: lensOutputId(input.lensOutputId),
    title: humanText("ThoughtCard title", input.title),
    body: humanText("ThoughtCard body", input.body),
    sourceParagraphIds: nonEmptySourceParagraphIds(input.sourceParagraphIds),
    confidence: confidence(input.confidence),
    generatedAt: knowledgeTime("ThoughtCard generatedAt", input.generatedAt),
  };
}

export function extractSourceParagraphsFromPublicDocument(
  input: PublicDocumentNormalizationInput,
): SourceParagraph[] {
  const sourceKey = publicDocumentSourceKey(input);
  const documentId = `source-document:${input.source.sourceName}:${input.source.sourceId}`;
  const documentFingerprint = publicDocumentSourceFingerprint(input);
  const paragraphs = splitSourceParagraphText(input.document.text);

  return paragraphs.map((text, index) =>
    createSourceParagraph({
      id: `source-paragraph:${sourceKey}:${index}`,
      canonicalEventId: sourceKey,
      documentId,
      paragraphIndex: index,
      sourceFingerprint: stableHash(
        JSON.stringify({
          sourceKey,
          documentFingerprint,
          paragraphIndex: index,
          text,
        }),
      ),
      text,
      context: {
        title: input.document.title,
        sourceName: input.source.sourceName,
        sourceRecordId: input.source.sourceId,
        sourceUrl: input.source.sourceUrl,
        license: input.source.license,
        retrievedAt: input.source.retrievedAt,
        parserVersion: "public-document:v1",
      },
    }),
  );
}

export const defaultPublicLensDefinitions: LensDefinition[] = [
  {
    id: "atlas",
    name: "Atlas",
    version: "1.0.0",
    userBlurb: "A map-like view that starts with the main landmarks and source trail.",
    technicalBlurb:
      "Deterministic source ordering: identity records first, then primary text and supporting evidence grouped by section.",
  },
  {
    id: "loom",
    name: "Loom",
    version: "1.0.0",
    userBlurb: "A woven view that emphasises how people, works, and ideas connect.",
    technicalBlurb:
      "Graph-biased projection: groups source event ids by shared identities, creators, works, and provenance lineage.",
  },
  {
    id: "beacon",
    name: "Beacon",
    version: "1.0.0",
    userBlurb: "A direct view that points at the clearest source records first.",
    technicalBlurb:
      "Signal-biased projection: ranks source event ids by focus-identity overlap and concise explainability.",
  },
];

export function createLensOutput(input: LensOutput): LensOutput {
  validateLensOutput(input);

  return input;
}

export function createDefaultPublicLensOutputs(
  scope: ImportScope,
  query: PublicContinuumQuery,
  events: CanonicalEvent[],
  generatedAt: string,
): LensOutput[] {
  if (query.scopeId !== scope.id) {
    throw new Error("PublicContinuumQuery scopeId must match the ImportScope id.");
  }

  const sourceEventIds = events.map((event) => event.id);

  return defaultPublicLensDefinitions.map((lens) =>
    createLensOutput({
      id: `lens-output:${query.id}:${lens.id}:${lens.version}`,
      scopeId: scope.id,
      queryId: query.id,
      lensId: lens.id,
      lensVersion: lens.version,
      generatedAt,
      sourceEventIds,
      sections: defaultLensSections(lens.id, scope, events),
      generation: {
        strategy: `default_${lens.id}`,
        model: null,
        parameters: [
          {
            key: "source",
            value: "canonical_event_ids",
          },
        ],
      },
    }),
  );
}

export function createDefaultPublicThoughtCards(
  lensOutput: LensOutput,
  sourceParagraphs: SourceParagraph[],
): ThoughtCard[] {
  const sourceEventOrder = new Map(
    lensOutput.sourceEventIds.map((eventId, index) => [eventId, index]),
  );
  const orderedParagraphs = sourceParagraphs
    .filter((paragraph) => sourceEventOrder.has(paragraph.canonicalEventId))
    .slice()
    .sort((left, right) => {
      const leftEventOrder = sourceEventOrder.get(left.canonicalEventId) ?? 0;
      const rightEventOrder = sourceEventOrder.get(right.canonicalEventId) ?? 0;

      if (leftEventOrder !== rightEventOrder) {
        return leftEventOrder - rightEventOrder;
      }

      return Number(left.paragraphIndex) - Number(right.paragraphIndex);
    });

  if (orderedParagraphs.length === 0) {
    throw new Error(
      "Default public Thought Cards require at least one Source Paragraph referenced by the Lens output.",
    );
  }

  return orderedParagraphs.map((paragraph, index) =>
    createThoughtCard({
      id: `thought-card:${lensOutput.id}:${index}`,
      lensOutputId: lensOutput.id,
      title: defaultThoughtCardTitle(paragraph.text),
      body: paragraph.text,
      sourceParagraphIds: [paragraph.id],
      confidence: 1,
      generatedAt: lensOutput.generatedAt,
    }),
  );
}

export function createLensFeedbackSignal(
  input: LensFeedbackSignal,
): LensFeedbackSignal {
  validateLensFeedbackSignal(input);

  return input;
}

function defaultLensSections(
  lensId: string,
  scope: ImportScope,
  events: CanonicalEvent[],
): LensOutputSection[] {
  if (lensId === "atlas") {
    return compactLensSections([
      {
        id: "atlas:identity",
        title: "Identity",
        eventIds: events
          .filter((event) => event.provenance.sourceName === "wikidata")
          .map((event) => event.id),
      },
      {
        id: "atlas:source-trail",
        title: "Source Trail",
        eventIds: events
          .filter((event) => event.provenance.sourceName !== "wikidata")
          .map((event) => event.id),
      },
    ]);
  }

  if (lensId === "loom") {
    const sourceFamilies = Array.from(
      new Set(events.map((event) => event.provenance.sourceFamily)),
    );

    return compactLensSections(
      sourceFamilies.map((sourceFamily) => ({
        id: `loom:${sourceFamily}`,
        title: sourceFamily,
        eventIds: events
          .filter((event) => event.provenance.sourceFamily === sourceFamily)
          .map((event) => event.id),
      })),
    );
  }

  if (lensId === "beacon") {
    return [
      {
        id: "beacon:strongest-signals",
        title: "Strongest Signals",
        eventIds: [...events]
          .sort(
            (left, right) =>
              evaluatePublicScopeEvent(scope, right).confidence -
              evaluatePublicScopeEvent(scope, left).confidence,
          )
          .map((event) => event.id),
      },
    ];
  }

  throw new Error(`Unknown default Lens id: ${lensId}`);
}

function compactLensSections(sections: LensOutputSection[]): LensOutputSection[] {
  return sections.filter((section) => section.eventIds.length > 0);
}

function defaultThoughtCardTitle(text: string): string {
  const firstSentence = text.trim().split(/[.!?]/)[0]?.trim() ?? "";
  const title = firstSentence.length > 0 ? firstSentence : text.trim();

  if (title.length <= 80) {
    return title;
  }

  return `${title.slice(0, 77).trim()}...`;
}

function validateNonBlank(fieldName: string, value: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${fieldName} must not be blank.`);
  }
}

function canonicalEventId(value: string): CanonicalEventId {
  validateNonBlank("CanonicalEventId", value);
  return value as CanonicalEventId;
}

function confidence(value: number): Confidence {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error("Confidence must be a finite number from 0 to 1.");
  }

  return value as Confidence;
}

function humanText(fieldName: string, value: string): HumanText {
  validateNonBlank(fieldName, value);
  return value as HumanText;
}

function knowledgeTime(fieldName: string, value: string): KnowledgeTime {
  if (Number.isNaN(new Date(value).getTime())) {
    throw new Error(`${fieldName} must be an ISO-compatible date.`);
  }

  return value as KnowledgeTime;
}

function lensOutputId(value: string): LensOutputId {
  validateNonBlank("LensOutputId", value);
  return value as LensOutputId;
}

function nonEmptySourceParagraphIds(
  values: string[],
): NonEmptyArray<SourceParagraphId> {
  if (values.length === 0) {
    throw new Error(
      "ThoughtCard sourceParagraphIds must contain at least one Source Paragraph id.",
    );
  }

  return values.map(sourceParagraphId) as NonEmptyArray<SourceParagraphId>;
}

function paragraphIndex(value: number): ParagraphIndex {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("SourceParagraph paragraphIndex must be a non-negative integer.");
  }

  return value as ParagraphIndex;
}

function parserVersion(value: string): ParserVersion {
  validateNonBlank("SourceParagraph context.parserVersion", value);
  return value as ParserVersion;
}

function sourceDocumentId(value: string): SourceDocumentId {
  validateNonBlank("SourceDocumentId", value);
  return value as SourceDocumentId;
}

function sourceFingerprint(value: string): SourceFingerprint {
  validateNonBlank("SourceFingerprint", value);

  if (!/^[0-9a-f]{16}$/.test(value)) {
    throw new Error("SourceFingerprint must be 16 lowercase hexadecimal characters.");
  }

  return value as SourceFingerprint;
}

function sourceName(value: string): SourceName {
  validateNonBlank("SourceParagraph context.sourceName", value);
  return value as SourceName;
}

function sourceParagraphId(value: string): SourceParagraphId {
  validateNonBlank("SourceParagraphId", value);
  return value as SourceParagraphId;
}

function sourceRecordId(value: string): SourceRecordId {
  validateNonBlank("SourceParagraph context.sourceRecordId", value);
  return value as SourceRecordId;
}

function sourceUrl(value: string): SourceUrl {
  validateNonBlank("SourceParagraph context.sourceUrl", value);

  try {
    new URL(value);
  } catch {
    throw new Error("SourceParagraph context.sourceUrl must be a valid URL.");
  }

  return value as SourceUrl;
}

function splitSourceParagraphText(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

function thoughtCardId(value: string): ThoughtCardId {
  validateNonBlank("ThoughtCardId", value);
  return value as ThoughtCardId;
}

function validateLensOutput(output: LensOutput): void {
  validateNonBlank("LensOutput id", output.id);
  validateNonBlank("LensOutput scopeId", output.scopeId);
  validateNonBlank("LensOutput queryId", output.queryId);
  validateNonBlank("LensOutput lensId", output.lensId);
  validateNonBlank("LensOutput lensVersion", output.lensVersion);

  if (Number.isNaN(new Date(output.generatedAt).getTime())) {
    throw new Error("LensOutput generatedAt must be an ISO-compatible date.");
  }

  if (output.sourceEventIds.length === 0) {
    throw new Error("LensOutput sourceEventIds must contain at least one event id.");
  }

  for (const sourceEventId of output.sourceEventIds) {
    validateNonBlank("LensOutput sourceEventIds", sourceEventId);
  }

  if (output.sections.length === 0) {
    throw new Error("LensOutput sections must contain at least one section.");
  }

  const sourceEventIds = new Set(output.sourceEventIds);

  for (const section of output.sections) {
    validateNonBlank("LensOutput section id", section.id);
    validateNonBlank("LensOutput section title", section.title);

    if (section.eventIds.length === 0) {
      throw new Error("LensOutput section eventIds must contain at least one event id.");
    }

    for (const eventId of section.eventIds) {
      validateNonBlank("LensOutput section eventIds", eventId);

      if (!sourceEventIds.has(eventId)) {
        throw new Error("LensOutput section eventIds must come from sourceEventIds.");
      }
    }
  }

  validateNonBlank("LensOutput generation.strategy", output.generation.strategy);

  if (output.generation.model !== null) {
    validateNonBlank("LensOutput generation.model", output.generation.model);
  }

  for (const parameter of output.generation.parameters) {
    validateNonBlank("LensOutput generation parameter key", parameter.key);
    validateNonBlank("LensOutput generation parameter value", parameter.value);
  }
}

function validateLensFeedbackSignal(signal: LensFeedbackSignal): void {
  validateNonBlank("LensFeedback id", signal.id);
  validateNonBlank("LensFeedback userId", signal.userId);
  validateNonBlank("LensFeedback scopeId", signal.scopeId);
  validateNonBlank("LensFeedback queryId", signal.queryId);
  validateNonBlank("LensFeedback selectedLensOutputId", signal.selectedLensOutputId);

  if (signal.candidateLensOutputIds.length === 0) {
    throw new Error(
      "LensFeedback candidateLensOutputIds must contain at least one Lens output id.",
    );
  }

  for (const candidateId of signal.candidateLensOutputIds) {
    validateNonBlank("LensFeedback candidateLensOutputIds", candidateId);
  }

  if (!signal.candidateLensOutputIds.includes(signal.selectedLensOutputId)) {
    throw new Error(
      "LensFeedback selectedLensOutputId must be in candidateLensOutputIds.",
    );
  }

  if (Number.isNaN(new Date(signal.createdAt).getTime())) {
    throw new Error("LensFeedback createdAt must be an ISO-compatible date.");
  }
}

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

export type LocalSourceCacheEventRow = {
  id: string;
  sourcePlatform: CanonicalSourcePlatform;
  sourceName: string;
  sourceKey: string;
  externalConversationId: string;
  externalMessageId: string;
  createdAt: string;
  createdAtConfidence: TimeConfidence;
  ingestedAt: string;
  actorRole: CanonicalActorRole;
  subject: string | null;
  text: string;
  eventJson: string;
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

export type RankingProfileName =
  | "balanced"
  | "semantic_heavy"
  | "recency_heavy"
  | "recurrence_heavy"
  | "explicit_cue_heavy";

export type RankingProfile = {
  name: RankingProfileName;
  debugOnly: true;
  weights: Record<RankingSignalKind, number>;
};

export type LinkReason = {
  text: string;
  rankingSignalKind: RankingSignalKind;
};

export type SignalEvidence = {
  rankingSignalKind: RankingSignalKind;
  value: number;
  weight: number;
  reason: string;
};

export type CandidateEntrySupport = {
  entryId: string;
  linkReasons: LinkReason[];
};

export type ContinuationCandidate = {
  id: string;
  title: string;
  confidence: number;
  supportingEntryIds: string[];
  supportingEntries: CandidateEntrySupport[];
  rankingSignals: RankingSignal[];
  signalEvidenceTrail: SignalEvidence[];
};

export type ContinuityRetrievalInput = {
  resumeRequest: ResumeRequest;
  entries: ImportedEntry[];
  rankingProfile: RankingProfile;
};

export type RankingProfileComparisonInput = {
  resumeRequest: ResumeRequest;
  entries: ImportedEntry[];
  rankingProfiles: RankingProfile[];
};

export type RankingProfileComparisonResult = {
  resumeRequest: ResumeRequest;
  profileResults: {
    profile: RankingProfile;
    candidates: ContinuationCandidate[];
  }[];
};

export type FeedbackSignalKind =
  | "explicit_user_correction"
  | "behavioural"
  | "model_assisted_critique";

export type ExplicitCorrectionAction = "strengthen" | "weaken" | "reject";

export type BehaviouralFeedbackAction = "selected" | "ignored" | "opened_alternate";

export type ModelAssistedCritiqueVerdict =
  | "supports_link"
  | "questions_link"
  | "rejects_link";

export type FeedbackSignalAuthority =
  | "user_correction"
  | "inspectable_evidence_only";

export type ContinuationCandidateReference = {
  id: string;
  title: string;
};

export type SupportingEntryReference = {
  entryId: string;
};

export type ContinuationLinkAdjustment = {
  candidateId: string;
  action: ExplicitCorrectionAction;
  confidenceDelta: number;
  rejected: boolean;
  reason: string;
};

type FeedbackSignalBase = {
  id: string;
  kind: FeedbackSignalKind;
  recordedAt: string;
  resumeRequest: ResumeRequest;
  continuationCandidate: ContinuationCandidateReference;
  supportingEntries: SupportingEntryReference[];
  authority: FeedbackSignalAuthority;
};

export type ExplicitCorrectionFeedbackSignal = FeedbackSignalBase & {
  kind: "explicit_user_correction";
  authority: "user_correction";
  correction: ExplicitCorrectionAction;
  rationale: string;
  linkAdjustment: ContinuationLinkAdjustment;
};

export type BehaviouralFeedbackSignal = FeedbackSignalBase & {
  kind: "behavioural";
  authority: "inspectable_evidence_only";
  behaviour: BehaviouralFeedbackAction;
  rationale: string;
};

export type ModelAssistedCritiqueFeedbackSignal = FeedbackSignalBase & {
  kind: "model_assisted_critique";
  authority: "inspectable_evidence_only";
  modelName: string;
  verdict: ModelAssistedCritiqueVerdict;
  critique: string;
};

export type FeedbackSignal =
  | ExplicitCorrectionFeedbackSignal
  | BehaviouralFeedbackSignal
  | ModelAssistedCritiqueFeedbackSignal;

export type FeedbackSignalInput =
  | {
      kind: "explicit_user_correction";
      recordedAt: string;
      correction: ExplicitCorrectionAction;
      rationale: string;
    }
  | {
      kind: "behavioural";
      recordedAt: string;
      behaviour: BehaviouralFeedbackAction;
      rationale: string;
    }
  | {
      kind: "model_assisted_critique";
      recordedAt: string;
      modelName: string;
      verdict: ModelAssistedCritiqueVerdict;
      critique: string;
    };

export type RetrievalFeedbackLoopInput = {
  resumeRequest: ResumeRequest;
  continuationCandidate: ContinuationCandidate;
  feedbackSignals: FeedbackSignalInput[];
};

export type RetrievalFeedbackLoop = {
  resumeRequest: ResumeRequest;
  continuationCandidate: ContinuationCandidateReference;
  supportingEntries: SupportingEntryReference[];
  feedbackSignals: FeedbackSignal[];
  linkAdjustments: ContinuationLinkAdjustment[];
};

export type AmbiguousResumeSurface = {
  kind: "ambiguous_resume";
  topCandidate: ContinuationCandidate | null;
  alternateCandidates: ContinuationCandidate[];
  candidates: ContinuationCandidate[];
  candidateSpread: number | null;
  isAmbiguous: boolean;
};

export type AmbiguousResumeSurfaceInput = ContinuityRetrievalInput & {
  narrowSpreadThreshold: number;
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

export {
  inspectMboxFile,
  parseMboxFile,
  parseMboxText,
  type MboxParseOptions,
  type MboxParseResult,
} from "./email-mbox";

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

export type GitHubUserRecord = {
  login: string;
  id: number;
  node_id: string;
  html_url: string;
  type: string;
};

export type GitHubIssueCommentRecord = {
  url: string;
  html_url: string;
  issue_url: string;
  id: number;
  node_id: string;
  user: GitHubUserRecord;
  created_at: string;
  updated_at: string;
  body: string;
  author_association: string;
};

export type GitHubIssueCommentNormalizationInput = {
  comment: GitHubIssueCommentRecord;
};

export type GitHubIssueCommentsExport = GitHubIssueCommentRecord[];

export type GitHubIssuePullRequestRecord = {
  url: string;
  html_url: string;
  diff_url: string;
  patch_url: string;
  merged_at: string | null;
};

export type GitHubIssueRecord = {
  url: string;
  repository_url: string;
  html_url: string;
  id: number;
  node_id: string;
  number: number;
  title: string;
  user: GitHubUserRecord;
  state: string;
  locked: boolean;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  body: string | null;
  author_association: string;
  pull_request: GitHubIssuePullRequestRecord | null;
};

export type GitHubIssueNormalizationInput = {
  issue: GitHubIssueRecord;
};

export type ImportProfile = "everything" | "clean_default" | "intentional_context";

export type ImportFilterAction = "include" | "exclude" | "needs_review";

export type ImportFilterReason =
  | "profile_everything"
  | "not_promotional_or_bulk"
  | "strong_user_intent"
  | "weak_passive_activity"
  | "uncertain_intent"
  | "sent_by_user"
  | "replied_contact"
  | "thread_participated"
  | "promotional_or_bulk"
  | "no_prior_engagement"
  | "primary_and_focus_match"
  | "primary_match_focus_uncertain"
  | "primary_identity_missing"
  | "source_family_not_allowed";

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

export type WikidataLocalizedValue = {
  language: string;
  value: string;
};

export type WikidataEntityNormalizationInput = {
  entities: Record<
    string,
    {
      pageid: number;
      ns: number;
      title: string;
      lastrevid: number;
      modified: string;
      type: "item";
      id: string;
      labels: {
        en: WikidataLocalizedValue;
      };
      descriptions: {
        en: WikidataLocalizedValue;
      };
      aliases: {
        en: WikidataLocalizedValue[];
      };
      claims: Record<string, unknown[]>;
      sitelinks: Record<string, unknown>;
    }
  >;
};

export type PublicDocumentCreatorRole = "author" | "translator" | "editor";

export type PublicDocumentNormalizationInput = {
  source: {
    platform: "public_archive" | "wikimedia";
    sourceFamily: string;
    sourceName: string;
    sourceId: string;
    sourceUrl: string;
    retrievedAt: string;
    license: string;
    upstreamSources: string[];
    derivedFrom: string[];
  };
  document: {
    title: string;
    language: string;
    publishedAt: string;
    publishedAtConfidence: TimeConfidence;
    creators: Array<{
      role: PublicDocumentCreatorRole;
      name: string;
    }>;
    subjectTags: string[];
    text: string;
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

export const debugRankingProfiles: Record<RankingProfileName, RankingProfile> = {
  balanced: {
    name: "balanced",
    debugOnly: true,
    weights: {
      text_overlap: 0.5,
      recency: 0.2,
      recurrence: 0.2,
      explicit_resume_cue: 0.1,
    },
  },
  semantic_heavy: {
    name: "semantic_heavy",
    debugOnly: true,
    weights: {
      text_overlap: 0.8,
      recency: 0.1,
      recurrence: 0.05,
      explicit_resume_cue: 0.05,
    },
  },
  recency_heavy: {
    name: "recency_heavy",
    debugOnly: true,
    weights: {
      text_overlap: 0.2,
      recency: 0.65,
      recurrence: 0.1,
      explicit_resume_cue: 0.05,
    },
  },
  recurrence_heavy: {
    name: "recurrence_heavy",
    debugOnly: true,
    weights: {
      text_overlap: 0.2,
      recency: 0.1,
      recurrence: 0.65,
      explicit_resume_cue: 0.05,
    },
  },
  explicit_cue_heavy: {
    name: "explicit_cue_heavy",
    debugOnly: true,
    weights: {
      text_overlap: 0.25,
      recency: 0.1,
      recurrence: 0.1,
      explicit_resume_cue: 0.55,
    },
  },
};

function provenanceKey(provenance: EventProvenance): string {
  const lineageInputs =
    provenance.derivedFrom.length > 0
      ? provenance.derivedFrom
      : provenance.upstreamSources;

  if (lineageInputs.length === 0) {
    return `source:${provenance.sourceFamily}:${provenance.sourceName}`;
  }

  const lineage = new Set(lineageInputs);

  return `lineage:${[...lineage].sort().join("|")}`;
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

export function canonicalEventToLocalSourceCacheEventRow(
  event: CanonicalEvent,
  ingestedAt: string,
): LocalSourceCacheEventRow {
  return {
    id: event.id,
    sourcePlatform: event.source.platform,
    sourceName: event.provenance.sourceName,
    sourceKey: event.source.key,
    externalConversationId: event.source.externalConversationId,
    externalMessageId: event.source.externalMessageId,
    createdAt: event.time.createdAt,
    createdAtConfidence: event.time.createdAtConfidence,
    ingestedAt,
    actorRole: event.actor.role,
    subject: event.content.subject,
    text: event.content.text,
    eventJson: JSON.stringify(event),
  };
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

function overlappingTokens(left: string, right: string): string[] {
  const leftTokens = tokenSet(left);
  const rightTokens = tokenSet(right);

  return [...leftTokens].filter((token) => rightTokens.has(token)).sort();
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

function linkReasonsForEntry(
  entry: ImportedEntry,
  request: ResumeRequest,
): LinkReason[] {
  const reasons: LinkReason[] = [];
  const overlaps = overlappingTokens(request.text, entryRetrievalText(entry));

  if (overlaps.length > 0) {
    reasons.push({
      rankingSignalKind: "text_overlap",
      text: `Matched request terms: ${overlaps.join(", ")}`,
    });
  }

  reasons.push({
    rankingSignalKind: "recency",
    text: `Entry occurred at ${entry.time.occurredAt}`,
  });

  if (hasExplicitResumeCue(request)) {
    reasons.push({
      rankingSignalKind: "explicit_resume_cue",
      text: `Resume Request starts with an explicit retrieval cue.`,
    });
  }

  return reasons;
}

function candidateReference(
  candidate: ContinuationCandidate,
): ContinuationCandidateReference {
  return {
    id: candidate.id,
    title: candidate.title,
  };
}

function supportingEntryReferences(
  candidate: ContinuationCandidate,
): SupportingEntryReference[] {
  return candidate.supportingEntryIds.map((entryId) => ({ entryId }));
}

function feedbackSignalId(input: {
  kind: FeedbackSignalKind;
  recordedAt: string;
  resumeRequest: ResumeRequest;
  candidateId: string;
  payload: string;
}): string {
  return `feedback-signal:${stableHash(
    [
      input.kind,
      input.recordedAt,
      input.resumeRequest.requestedAt,
      input.resumeRequest.text,
      input.candidateId,
      input.payload,
    ].join("\n"),
  )}`;
}

function confidenceDeltaForCorrection(
  correction: ExplicitCorrectionAction,
): number {
  if (correction === "strengthen") {
    return 0.1;
  }

  if (correction === "weaken") {
    return -0.1;
  }

  return -1;
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

const mediaWikiRevisionSchema = z
  .object({
    project: z.string(),
    page: z
      .object({
        pageid: z.number(),
        ns: z.number(),
        title: z.string(),
      })
      .passthrough(),
    revision: z
      .object({
        revid: z.number(),
        parentid: z.number(),
        timestamp: isoDatetimeSchema,
        user: z.string(),
        userid: z.number().nullable(),
        comment: z.string(),
        sha1: z.string(),
        size: z.number(),
        slots: z.object({
          main: z.object({
            contentmodel: z.string(),
            contentformat: z.string(),
            contentSha1: z.string(),
          }),
        }),
      })
      .passthrough(),
  })
  .passthrough();

const wikidataLocalizedValueSchema = z.object({
  language: z.string(),
  value: z.string(),
});

const wikidataEntitySchema = z
  .object({
    pageid: z.number(),
    ns: z.number(),
    title: z.string(),
    lastrevid: z.number(),
    modified: isoDatetimeSchema,
    type: z.literal("item"),
    id: z.string(),
    labels: z.object({
      en: wikidataLocalizedValueSchema,
    }),
    descriptions: z.object({
      en: wikidataLocalizedValueSchema,
    }),
    aliases: z.object({
      en: z.array(wikidataLocalizedValueSchema),
    }),
    claims: z.record(z.string(), z.array(z.unknown())),
    sitelinks: z.record(z.string(), z.unknown()),
  })
  .passthrough();

const wikidataEntityExportSchema = z
  .object({
    entities: z.record(z.string(), wikidataEntitySchema),
  })
  .passthrough();

const nonBlankStringSchema = z.string().min(1);

const nullableIsoDatetimeFromMissingSchema = z.preprocess(
  (value) => value ?? null,
  isoDatetimeSchema.nullable(),
);

const githubUserSchema = z
  .object({
    login: nonBlankStringSchema,
    id: z.number(),
    node_id: nonBlankStringSchema,
    html_url: nonBlankStringSchema,
    type: nonBlankStringSchema,
  })
  .passthrough();

const githubIssueCommentSchema = z
  .object({
    url: nonBlankStringSchema,
    html_url: nonBlankStringSchema,
    issue_url: nonBlankStringSchema,
    id: z.number(),
    node_id: nonBlankStringSchema,
    user: githubUserSchema,
    created_at: isoDatetimeSchema,
    updated_at: isoDatetimeSchema,
    body: z.string(),
    author_association: nonBlankStringSchema,
  })
  .passthrough();

const githubIssueCommentsSchema = z
  .union([githubIssueCommentSchema, z.array(githubIssueCommentSchema)])
  .transform((value) => (Array.isArray(value) ? value : [value]));

const githubIssuePullRequestSchema = z
  .object({
    url: nonBlankStringSchema,
    html_url: nonBlankStringSchema,
    diff_url: nonBlankStringSchema,
    patch_url: nonBlankStringSchema,
    merged_at: nullableIsoDatetimeFromMissingSchema,
  })
  .passthrough();

const githubIssueSchema = z
  .object({
    url: nonBlankStringSchema,
    repository_url: nonBlankStringSchema,
    html_url: nonBlankStringSchema,
    id: z.number(),
    node_id: nonBlankStringSchema,
    number: z.number(),
    title: nonBlankStringSchema,
    user: githubUserSchema,
    state: nonBlankStringSchema,
    locked: z.boolean(),
    comments: z.number(),
    created_at: isoDatetimeSchema,
    updated_at: isoDatetimeSchema,
    closed_at: nullableIsoDatetimeFromMissingSchema,
    body: nullableStringFromMissingSchema,
    author_association: nonBlankStringSchema,
    pull_request: z.preprocess(
      (value) => value ?? null,
      githubIssuePullRequestSchema.nullable(),
    ),
  })
  .passthrough();

const publicDocumentCreatorSchema = z.object({
  role: z.enum(["author", "translator", "editor"]),
  name: nonBlankStringSchema,
});

const publicDocumentSchema = z.object({
  source: z.object({
    platform: z.enum(["public_archive", "wikimedia"]),
    sourceFamily: nonBlankStringSchema,
    sourceName: nonBlankStringSchema,
    sourceId: nonBlankStringSchema,
    sourceUrl: nonBlankStringSchema,
    retrievedAt: isoDatetimeSchema,
    license: nonBlankStringSchema,
    upstreamSources: z.array(nonBlankStringSchema),
    derivedFrom: z.array(nonBlankStringSchema),
  }),
  document: z.object({
    title: nonBlankStringSchema,
    language: nonBlankStringSchema,
    publishedAt: isoDatetimeSchema,
    publishedAtConfidence: z.enum(["exact", "inferred", "unknown"]),
    creators: z.array(publicDocumentCreatorSchema),
    subjectTags: z.array(nonBlankStringSchema),
    text: nonBlankStringSchema,
  }),
});

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

export function parseMediaWikiRevision(
  input: unknown,
): SourceValidationResult<MediaWikiRevisionNormalizationInput> {
  const result = mediaWikiRevisionSchema.safeParse(input);

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

export function parseWikidataEntity(
  input: unknown,
): SourceValidationResult<WikidataEntityNormalizationInput> {
  const result = wikidataEntityExportSchema.safeParse(input);

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

export function parsePublicDocument(
  input: unknown,
): SourceValidationResult<PublicDocumentNormalizationInput> {
  const result = publicDocumentSchema.safeParse(input);

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

export function parseGitHubIssueComment(
  input: unknown,
): SourceValidationResult<GitHubIssueCommentRecord> {
  const result = githubIssueCommentSchema.safeParse(input);

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

export function parseGitHubIssueComments(
  input: unknown,
): SourceValidationResult<GitHubIssueCommentsExport> {
  const result = githubIssueCommentsSchema.safeParse(input);

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

export function parseGitHubIssue(
  input: unknown,
): SourceValidationResult<GitHubIssueRecord> {
  const result = githubIssueSchema.safeParse(input);

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

function gitHubRepositoryIdFromApiUrl(repositoryUrl: string): string {
  const url = new URL(repositoryUrl);
  const parts = url.pathname.split("/").filter((part) => part.length > 0);
  const owner = parts[1] ?? "";
  const repo = parts[2] ?? "";

  if (
    parts[0] !== "repos" ||
    owner.length === 0 ||
    repo.length === 0
  ) {
    throw new Error(
      "GitHub repository_url must use /repos/:owner/:repo.",
    );
  }

  return `${owner}/${repo}`;
}

function gitHubIssueId(input: GitHubIssueNormalizationInput): string {
  return `${gitHubRepositoryIdFromApiUrl(input.issue.repository_url)}#${input.issue.number}`;
}

function gitHubIssueKind(input: GitHubIssueNormalizationInput): "issue" | "pull_request" {
  return input.issue.pull_request === null ? "issue" : "pull_request";
}

function gitHubIssueExternalMessageId(
  input: GitHubIssueNormalizationInput,
): string {
  return `${input.issue.id}:${input.issue.node_id}`;
}

function gitHubIssueSourceKey(input: GitHubIssueNormalizationInput): string {
  return `github_issue:${gitHubIssueId(input)}:${gitHubIssueExternalMessageId(input)}`;
}

function gitHubIssueSourceFingerprint(
  input: GitHubIssueNormalizationInput,
): string {
  return stableHash(
    JSON.stringify({
      platform: "github",
      url: input.issue.url,
      repository_url: input.issue.repository_url,
      html_url: input.issue.html_url,
      id: input.issue.id,
      node_id: input.issue.node_id,
      number: input.issue.number,
      title: input.issue.title,
      user: input.issue.user,
      state: input.issue.state,
      locked: input.issue.locked,
      comments: input.issue.comments,
      created_at: input.issue.created_at,
      updated_at: input.issue.updated_at,
      closed_at: input.issue.closed_at,
      body: input.issue.body,
      author_association: input.issue.author_association,
      pull_request: input.issue.pull_request,
    }),
  );
}

function gitHubIssueText(input: GitHubIssueNormalizationInput): string {
  const repositoryId = gitHubRepositoryIdFromApiUrl(input.issue.repository_url);
  const kind = gitHubIssueKind(input);
  const pullRequestUrl =
    input.issue.pull_request === null
      ? null
      : `Pull Request: ${input.issue.pull_request.html_url}`;
  const closedAt =
    input.issue.closed_at === null
      ? null
      : `Closed: ${new Date(input.issue.closed_at).toISOString()}`;

  return [
    input.issue.title,
    input.issue.body?.trim() ?? null,
    `Repository: ${repositoryId}`,
    `Number: ${input.issue.number}`,
    `State: ${input.issue.state}`,
    `Kind: ${kind}`,
    pullRequestUrl,
    `Author: ${input.issue.user.login}`,
    `Association: ${input.issue.author_association}`,
    `Comments: ${input.issue.comments}`,
    closedAt,
  ]
    .filter((value): value is string => value !== null && value.length > 0)
    .join("\n");
}

function gitHubIssueCommentIssueId(
  input: GitHubIssueCommentNormalizationInput,
): string {
  const issueUrl = new URL(input.comment.issue_url);
  const parts = issueUrl.pathname.split("/").filter((part) => part.length > 0);
  const owner = parts[1] ?? "";
  const repo = parts[2] ?? "";
  const issueNumber = parts[4] ?? "";

  if (
    parts[0] !== "repos" ||
    parts[3] !== "issues" ||
    owner.length === 0 ||
    repo.length === 0 ||
    !/^\d+$/.test(issueNumber)
  ) {
    throw new Error(
      "GitHub issue comment issue_url must use /repos/:owner/:repo/issues/:number.",
    );
  }

  return `${owner}/${repo}#${issueNumber}`;
}

function gitHubIssueCommentExternalMessageId(
  input: GitHubIssueCommentNormalizationInput,
): string {
  return `${input.comment.id}:${input.comment.node_id}`;
}

function gitHubIssueCommentSourceKey(
  input: GitHubIssueCommentNormalizationInput,
): string {
  return `github_issue_comment:${gitHubIssueCommentIssueId(input)}:${gitHubIssueCommentExternalMessageId(input)}`;
}

function gitHubIssueCommentSourceFingerprint(
  input: GitHubIssueCommentNormalizationInput,
): string {
  return stableHash(
    JSON.stringify({
      platform: "github",
      url: input.comment.url,
      html_url: input.comment.html_url,
      issue_url: input.comment.issue_url,
      id: input.comment.id,
      node_id: input.comment.node_id,
      user: input.comment.user,
      created_at: input.comment.created_at,
      updated_at: input.comment.updated_at,
      body: input.comment.body,
      author_association: input.comment.author_association,
    }),
  );
}

function gitHubIssueCommentText(
  input: GitHubIssueCommentNormalizationInput,
): string {
  const issueId = gitHubIssueCommentIssueId(input);

  return [
    input.comment.body.trim(),
    `Issue: ${issueId}`,
    `Comment: ${input.comment.html_url}`,
    `Author: ${input.comment.user.login}`,
    `Association: ${input.comment.author_association}`,
  ]
    .filter((value) => value.length > 0)
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

function singleWikidataEntity(input: WikidataEntityNormalizationInput): {
  entityKey: string;
  entity: WikidataEntityNormalizationInput["entities"][string];
} {
  const entries = Object.entries(input.entities);

  if (entries.length !== 1) {
    throw new Error("Wikidata entity import expects exactly one entity.");
  }

  const [entityKey, entity] = entries[0]!;

  if (entity.id !== entityKey) {
    throw new Error("Wikidata entity key must match entity id.");
  }

  return { entityKey, entity };
}

function wikidataSourceKey(entityId: string): string {
  return `wikidata:${entityId}`;
}

function wikidataEntityText(
  entity: WikidataEntityNormalizationInput["entities"][string],
): string {
  const aliases = entity.aliases.en.map((alias) => alias.value).join("; ");

  return [
    entity.labels.en.value,
    entity.descriptions.en.value,
    aliases.length > 0 ? `Aliases: ${aliases}` : null,
    `Wikidata entity: ${entity.id}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function wikidataSourceFingerprint(
  input: WikidataEntityNormalizationInput,
): string {
  const { entity } = singleWikidataEntity(input);

  return stableHash(
    JSON.stringify({
      platform: "wikimedia",
      sourceName: "wikidata",
      id: entity.id,
      lastrevid: entity.lastrevid,
      modified: entity.modified,
      labels: entity.labels,
      descriptions: entity.descriptions,
      aliases: entity.aliases,
      claims: entity.claims,
      sitelinks: entity.sitelinks,
    }),
  );
}

function publicDocumentSourceKey(input: PublicDocumentNormalizationInput): string {
  return `${input.source.platform}:${input.source.sourceName}:${input.source.sourceId}`;
}

function publicDocumentSourceFingerprint(
  input: PublicDocumentNormalizationInput,
): string {
  return stableHash(
    JSON.stringify({
      platform: input.source.platform,
      sourceFamily: input.source.sourceFamily,
      sourceName: input.source.sourceName,
      sourceId: input.source.sourceId,
      sourceUrl: input.source.sourceUrl,
      retrievedAt: input.source.retrievedAt,
      license: input.source.license,
      upstreamSources: input.source.upstreamSources,
      derivedFrom: input.source.derivedFrom,
      title: input.document.title,
      language: input.document.language,
      publishedAt: input.document.publishedAt,
      publishedAtConfidence: input.document.publishedAtConfidence,
      creators: input.document.creators,
      subjectTags: input.document.subjectTags,
      text: input.document.text,
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
    confidence: input.profile === "intentional_context" ? 0.8 : 0.6,
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

function includeDecision(reason: ImportFilterReason, confidence: number): ImportFilterDecision {
  return {
    action: "include",
    reason,
    confidence,
  };
}

function needsReviewDecision(
  reason: ImportFilterReason,
  confidence: number,
): ImportFilterDecision {
  return {
    action: "needs_review",
    reason,
    confidence,
  };
}

function isGoogleStrongIntentEvent(event: CanonicalEvent): boolean {
  if (event.provenance.sourceName === "google_chrome_bookmarks") {
    return true;
  }

  if (event.provenance.sourceName === "google_chrome_reading_list") {
    return true;
  }

  if (event.provenance.sourceName !== "google_my_activity") {
    return false;
  }

  return event.source.externalConversationId === "Search" ||
    event.source.externalConversationId === "Maps";
}

function isGoogleWeakPassiveEvent(event: CanonicalEvent): boolean {
  if (event.provenance.sourceName === "google_chrome_history") {
    return true;
  }

  if (event.provenance.sourceName !== "google_my_activity") {
    return false;
  }

  return event.source.externalConversationId === "YouTube" &&
    event.content.text.toLowerCase().includes("watch history");
}

export function evaluateCanonicalEventImportProfile(input: {
  profile: ImportProfile;
  event: CanonicalEvent;
}): ImportFilterDecision {
  if (input.profile === "everything") {
    return includeDecision("profile_everything", 1);
  }

  if (input.profile === "clean_default") {
    return includeDecision("not_promotional_or_bulk", 0.85);
  }

  if (isGoogleStrongIntentEvent(input.event)) {
    return includeDecision("strong_user_intent", 0.9);
  }

  if (isGoogleWeakPassiveEvent(input.event)) {
    return needsReviewDecision("weak_passive_activity", 0.8);
  }

  return needsReviewDecision("uncertain_intent", 0.6);
}

export function createMemoryActiveImportedEntries(input: {
  events: CanonicalEvent[];
  decisions: ImportFilterDecision[];
}): ImportedEntry[] {
  if (input.events.length !== input.decisions.length) {
    throw new Error("events and decisions must have the same length.");
  }

  return input.events
    .filter((_, index) => input.decisions[index]?.action === "include")
    .map((event) => createImportedEntryFromCanonicalEvent(event));
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
  const { weights } = input.rankingProfile;
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
          weight: weights.text_overlap,
        },
        {
          kind: "recency",
          value: clampConfidence(candidate.recency),
          weight: weights.recency,
        },
        {
          kind: "recurrence",
          value: clampConfidence(recurrence),
          weight: weights.recurrence,
        },
        {
          kind: "explicit_resume_cue",
          value: explicitCue,
          weight: weights.explicit_resume_cue,
        },
      ];
      const confidence = clampConfidence(
        rankingSignals.reduce(
          (total, signal) => total + signal.value * signal.weight,
          0,
        ),
      );
      const signalEvidenceTrail: SignalEvidence[] = [
        {
          rankingSignalKind: "text_overlap",
          value: clampConfidence(candidate.textOverlap),
          weight: weights.text_overlap,
          reason:
            candidate.textOverlap > 0
              ? "Candidate has request terms in supporting Entries."
              : "Candidate has no request term overlap.",
        },
        {
          rankingSignalKind: "recency",
          value: clampConfidence(candidate.recency),
          weight: weights.recency,
          reason: "Candidate uses the most recent supporting Entry.",
        },
        {
          rankingSignalKind: "recurrence",
          value: clampConfidence(recurrence),
          weight: weights.recurrence,
          reason: `Candidate has ${candidate.entries.length} supporting Entries.`,
        },
        {
          rankingSignalKind: "explicit_resume_cue",
          value: explicitCue,
          weight: weights.explicit_resume_cue,
          reason:
            explicitCue > 0
              ? "Resume Request contains an explicit retrieval cue."
              : "Resume Request does not contain an explicit retrieval cue.",
        },
      ];

      return {
        id: `continuation-candidate:${stableHash(candidate.title.toLowerCase())}`,
        title: candidate.title,
        confidence,
        supportingEntryIds: candidate.entries.map((entry) => entry.id),
        supportingEntries: candidate.entries.map((entry) => ({
          entryId: entry.id,
          linkReasons: linkReasonsForEntry(entry, input.resumeRequest),
        })),
        rankingSignals,
        signalEvidenceTrail,
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

export function compareRankingProfiles(
  input: RankingProfileComparisonInput,
): RankingProfileComparisonResult {
  return {
    resumeRequest: input.resumeRequest,
    profileResults: input.rankingProfiles.map((profile) => ({
      profile,
      candidates: retrieveContinuationCandidates({
        resumeRequest: input.resumeRequest,
        entries: input.entries,
        rankingProfile: profile,
      }),
    })),
  };
}

export function recordRetrievalFeedbackLoop(
  input: RetrievalFeedbackLoopInput,
): RetrievalFeedbackLoop {
  const continuationCandidate = candidateReference(input.continuationCandidate);
  const supportingEntries = supportingEntryReferences(input.continuationCandidate);
  const feedbackSignals = input.feedbackSignals.map((signal): FeedbackSignal => {
    if (signal.kind === "explicit_user_correction") {
      const linkAdjustment: ContinuationLinkAdjustment = {
        candidateId: continuationCandidate.id,
        action: signal.correction,
        confidenceDelta: confidenceDeltaForCorrection(signal.correction),
        rejected: signal.correction === "reject",
        reason: signal.rationale,
      };

      return {
        id: feedbackSignalId({
          kind: signal.kind,
          recordedAt: signal.recordedAt,
          resumeRequest: input.resumeRequest,
          candidateId: continuationCandidate.id,
          payload: `${signal.correction}\n${signal.rationale}`,
        }),
        kind: signal.kind,
        recordedAt: signal.recordedAt,
        resumeRequest: input.resumeRequest,
        continuationCandidate,
        supportingEntries,
        authority: "user_correction",
        correction: signal.correction,
        rationale: signal.rationale,
        linkAdjustment,
      };
    }

    if (signal.kind === "behavioural") {
      return {
        id: feedbackSignalId({
          kind: signal.kind,
          recordedAt: signal.recordedAt,
          resumeRequest: input.resumeRequest,
          candidateId: continuationCandidate.id,
          payload: `${signal.behaviour}\n${signal.rationale}`,
        }),
        kind: signal.kind,
        recordedAt: signal.recordedAt,
        resumeRequest: input.resumeRequest,
        continuationCandidate,
        supportingEntries,
        authority: "inspectable_evidence_only",
        behaviour: signal.behaviour,
        rationale: signal.rationale,
      };
    }

    return {
      id: feedbackSignalId({
        kind: signal.kind,
        recordedAt: signal.recordedAt,
        resumeRequest: input.resumeRequest,
        candidateId: continuationCandidate.id,
        payload: `${signal.modelName}\n${signal.verdict}\n${signal.critique}`,
      }),
      kind: signal.kind,
      recordedAt: signal.recordedAt,
      resumeRequest: input.resumeRequest,
      continuationCandidate,
      supportingEntries,
      authority: "inspectable_evidence_only",
      modelName: signal.modelName,
      verdict: signal.verdict,
      critique: signal.critique,
    };
  });

  return {
    resumeRequest: input.resumeRequest,
    continuationCandidate,
    supportingEntries,
    feedbackSignals,
    linkAdjustments: feedbackSignals.flatMap((signal) =>
      signal.kind === "explicit_user_correction" ? [signal.linkAdjustment] : [],
    ),
  };
}

export function createAmbiguousResumeSurface(
  input: AmbiguousResumeSurfaceInput,
): AmbiguousResumeSurface {
  const candidates = retrieveContinuationCandidates(input);
  const topCandidate = candidates[0] ?? null;
  const secondCandidate = candidates[1] ?? null;
  const candidateSpread =
    topCandidate === null || secondCandidate === null
      ? null
      : clampConfidence(topCandidate.confidence - secondCandidate.confidence);

  return {
    kind: "ambiguous_resume",
    topCandidate,
    alternateCandidates: candidates.slice(1),
    candidates,
    candidateSpread,
    isAmbiguous:
      candidateSpread !== null && candidateSpread <= input.narrowSpreadThreshold,
  };
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

export function normalizeGitHubIssue(
  input: GitHubIssueNormalizationInput,
): CanonicalEvent {
  const sourceKey = gitHubIssueSourceKey(input);
  const issueId = gitHubIssueId(input);
  const kind = gitHubIssueKind(input);

  return buildCanonicalEvent({
    source: {
      platform: "github",
      key: sourceKey,
      fingerprint: gitHubIssueSourceFingerprint(input),
      externalConversationId: issueId,
      externalMessageId: gitHubIssueExternalMessageId(input),
      artifactId: input.issue.html_url,
      externalParentId: null,
      canonicalParentEventId: null,
    },
    provenance: {
      sourceFamily: "software_development",
      sourceName: "github",
      upstreamSources: [],
      derivedFrom: [],
      retrievedAt: new Date(input.issue.created_at).toISOString(),
      license: null,
    },
    time: {
      createdAt: new Date(input.issue.created_at).toISOString(),
      createdAtConfidence: "exact",
    },
    actor: {
      role: "user",
    },
    participants: [
      {
        role: "author",
        name: input.issue.user.login,
        address: input.issue.user.html_url,
      },
    ],
    content: {
      kind: "text",
      subject: `${issueId} ${kind === "pull_request" ? "pull request" : "issue"}`,
      text: gitHubIssueText(input),
    },
  });
}

export function normalizeGitHubIssueComment(
  input: GitHubIssueCommentNormalizationInput,
): CanonicalEvent {
  const sourceKey = gitHubIssueCommentSourceKey(input);
  const issueId = gitHubIssueCommentIssueId(input);

  return buildCanonicalEvent({
    source: {
      platform: "github",
      key: sourceKey,
      fingerprint: gitHubIssueCommentSourceFingerprint(input),
      externalConversationId: issueId,
      externalMessageId: gitHubIssueCommentExternalMessageId(input),
      artifactId: input.comment.html_url,
      externalParentId: null,
      canonicalParentEventId: null,
    },
    provenance: {
      sourceFamily: "software_development",
      sourceName: "github",
      upstreamSources: [],
      derivedFrom: [],
      retrievedAt: new Date(input.comment.created_at).toISOString(),
      license: null,
    },
    time: {
      createdAt: new Date(input.comment.created_at).toISOString(),
      createdAtConfidence: "exact",
    },
    actor: {
      role: "user",
    },
    participants: [
      {
        role: "author",
        name: input.comment.user.login,
        address: input.comment.user.html_url,
      },
    ],
    content: {
      kind: "text",
      subject: `${issueId} issue comment`,
      text: gitHubIssueCommentText(input),
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
      sourceFamily: "wikimedia",
      sourceName: "wikipedia",
      upstreamSources: ["wikimedia"],
      derivedFrom: [],
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

export function normalizeWikidataEntity(
  input: WikidataEntityNormalizationInput,
): CanonicalEvent {
  const { entity } = singleWikidataEntity(input);
  const sourceKey = wikidataSourceKey(entity.id);

  return buildCanonicalEvent({
    source: {
      platform: "wikimedia",
      key: sourceKey,
      fingerprint: wikidataSourceFingerprint(input),
      externalConversationId: sourceKey,
      externalMessageId: String(entity.lastrevid),
      artifactId: sourceKey,
      externalParentId: null,
      canonicalParentEventId: null,
    },
    provenance: {
      sourceFamily: "wikimedia",
      sourceName: "wikidata",
      upstreamSources: ["wikimedia"],
      derivedFrom: [],
      retrievedAt: "unknown",
      license: "CC0",
    },
    time: {
      createdAt: new Date(entity.modified).toISOString(),
      createdAtConfidence: "exact",
    },
    actor: {
      role: "other",
    },
    participants: [],
    content: {
      kind: "text",
      subject: entity.labels.en.value,
      text: wikidataEntityText(entity),
    },
  });
}

export function normalizePublicDocument(
  input: PublicDocumentNormalizationInput,
): CanonicalEvent {
  const sourceKey = publicDocumentSourceKey(input);

  return buildCanonicalEvent({
    source: {
      platform: input.source.platform,
      key: sourceKey,
      fingerprint: publicDocumentSourceFingerprint(input),
      externalConversationId: `${input.source.sourceName}:${input.source.sourceId}`,
      externalMessageId: input.source.sourceId,
      artifactId: input.source.sourceUrl,
      externalParentId: null,
      canonicalParentEventId: null,
    },
    provenance: {
      sourceFamily: input.source.sourceFamily,
      sourceName: input.source.sourceName,
      upstreamSources: input.source.upstreamSources,
      derivedFrom: input.source.derivedFrom,
      retrievedAt: input.source.retrievedAt,
      license: input.source.license,
    },
    time: {
      createdAt: new Date(input.document.publishedAt).toISOString(),
      createdAtConfidence: input.document.publishedAtConfidence,
    },
    actor: {
      role: "other",
    },
    participants: input.document.creators.map((creator) => ({
      role: creator.role,
      name: creator.name,
      address: creator.name,
    })),
    content: {
      kind: "text",
      subject: input.document.title,
      text: input.document.text,
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
