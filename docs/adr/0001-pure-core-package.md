# Pure Core Package

Continuum Core is a pure TypeScript core package: host applications own capture devices, UI, network transport, and concrete storage, while the core owns domain behavior around Entries, Continuations, Resume Briefs, and forgetting. This keeps the MVP usable from multiple products without turning the core library into an app runtime.
