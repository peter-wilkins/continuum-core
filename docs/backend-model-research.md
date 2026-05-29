# Backend Model Research

Continuum's public MVP should stay source-backed and inspectable while we improve the Lens and synthesis models.

## Useful Current Patterns

### Retrieval-Augmented Generation

RAG combines retrieved source material with model generation. For Continuum, the important lesson is not "ask an LLM over everything"; it is "keep answers grounded in explicitly retrieved evidence." The original RAG work framed retrieval as an external memory for knowledge-intensive tasks.

Source: https://papers.nips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html

### Reciprocal Rank Fusion

Reciprocal Rank Fusion combines several rankings into one stable ranking without requiring a trained model. This fits Continuum's MVP well because Atlas, Loom, Beacon, lexical query overlap, and later embedding retrieval can each produce a ranking over the same immutable source ids.

Source: https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf

### Maximal Marginal Relevance

MMR balances relevance with novelty. This maps well to Peter's feedback that duplicate Lens outputs waste attention. We want useful variety, not the same result wearing a different name.

Source: https://www.cs.cmu.edu/afs/.cs.cmu.edu/Web/People/jgc/publication/MMR_DiversityBased_Reranking_SIGIR_1998.pdf

### GraphRAG

GraphRAG is aimed at broad "what are the themes?" questions across a corpus. It builds graph/community summaries before answering. This is relevant to Continuum's chairman and synthesis direction, but it is heavier than the public MVP needs today.

Source: https://www.microsoft.com/en-us/research/publication/from-local-to-global-a-graph-rag-approach-to-query-focused-summarization/

### HyDE

HyDE generates a hypothetical answer document from a query, embeds that, and retrieves real documents near it. This is promising once Continuum has model adapters and embeddings, especially for spoken vague queries.

Source: https://arxiv.org/abs/2212.10496

### Late Interaction And Learned Sparse Retrieval

ColBERT-style late interaction and SPLADE-style learned sparse retrieval are stronger retrieval model families than simple embeddings or keyword overlap. They are likely future adapter candidates, not core deterministic MVP code.

Sources:

- https://arxiv.org/abs/2004.12832
- https://arxiv.org/abs/2107.05720

### Lost In The Middle

Long context does not remove the need for retrieval. Models can use context unevenly depending on where evidence appears. Continuum should rank and pack evidence deliberately instead of dumping whole documents into a prompt.

Source: https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00638/119630/Lost-in-the-Middle-How-Language-Models-Use-Long

## MVP Decision

Add a deterministic Lens called `Prism`.

Prism uses current source ids only. It combines multiple existing signals with reciprocal-rank fusion and applies a small source-family diversity penalty. When all active records come from one source family, Prism falls back to newest-first ordering so it does not duplicate Loom or Beacon.

This is deliberately not a trained model and not an LLM call. It is a testable baseline that points toward hybrid retrieval and reranking later.

