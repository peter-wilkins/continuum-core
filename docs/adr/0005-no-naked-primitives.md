# No Naked Primitives

Continuum Core public domain models should use named domain types instead of naked primitive fields. IDs, timestamps, confidence values, source references, provenance keys, machine states, and generated-view handles should be represented by explicit domain scalars or structured value objects.

Primitive `string`, `number`, and `boolean` values are allowed at IO boundaries, storage boundaries, parser boundaries, generated fixtures, low-level constructors, and explicit exceptions. Human-readable text should still be named when it crosses a public domain boundary, so future readers can tell whether a value is text for people, an identifier, a timestamp, a source key, or a machine state.

This keeps agent-written code from mixing lookalike values, such as Lens ids and query ids, Occurrence Time and Knowledge Time, Source Paragraph references and generated Thought Card text. Runtime validation should parse raw wire/storage values into these domain shapes before normal domain behavior runs.
