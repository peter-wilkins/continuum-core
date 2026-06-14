declare module "virtual:continuum-git-hash" {
  export const gitHash: string;
}

declare module "virtual:continuum-import-workbench-data" {
  export const importWorkbenchData: {
    generatedAt: string;
    runRoot: string;
    eventsPath: string;
    previews: Record<string, unknown>;
    sourceCounts: Record<string, number>;
    events: Array<{
      id: string;
      source: {
        platform: string;
      };
      provenance: {
        sourceName: string;
      };
      time: {
        createdAt: string;
      };
      actor: {
        role: string;
      };
      content: {
        subject: string | null;
        text: string;
      };
    }>;
    retrieval: {
      resumeRequest: {
        text: string;
        requestedAt: string;
      };
      isAmbiguous: boolean;
      candidateSpread: number | null;
      candidates: Array<{
        id: string;
        title: string;
        confidence: number;
        supportingEntryIds: string[];
        rankingSignals: Array<{
          kind: string;
          value: number;
          weight: number;
        }>;
        signalEvidenceTrail: Array<{
          rankingSignalKind: string;
          value: number;
          weight: number;
          reason: string;
        }>;
      }>;
    };
    codexConversationSearch: {
      ready: boolean;
      databasePath: string;
      databaseBytes: number;
      conversationFlowDirectory: string;
      projectionFileCount: number;
    };
  };
}
