# Performance Headroom Without Premature Optimization

Continuum Core should preserve cheap structure and stable references early when doing so keeps future access efficient, but it should not build complex performance machinery before the product path proves it is needed.

This means import and capture code should avoid throwing away useful source coordinates, ordering, fingerprints, offsets, and grouping information. For example, document-like sources should prefer paragraph-level references with enough locator data to retrieve or verify the paragraph later, rather than only pointing at a whole document.

It also means performance should influence data boundaries before it creates infrastructure. Prefer reference-only materialized views, explicit locators, stable source ids, rebuildable projections, and compact value objects. Defer secondary indexes, caches, background compaction, columnar layouts, and specialized storage engines until they solve a measured or product-visible problem.
