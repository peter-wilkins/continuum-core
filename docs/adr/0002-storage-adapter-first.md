# Storage Adapter First

Continuum Core exposes a storage adapter interface and ships an in-memory implementation for tests and prototypes, rather than owning SQLite, Postgres, Supabase, or another concrete store in the first iteration. Host Apps can choose persistence later without the core package taking an early infrastructure dependency.
