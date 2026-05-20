# Model Adapter with Deterministic Fallback

Continuum Core depends on a model adapter interface for embeddings, summaries, and classification, and ships a deterministic fallback for tests and offline prototypes. This avoids making a model provider part of the core contract while still allowing Host Apps to wire in stronger inference.
