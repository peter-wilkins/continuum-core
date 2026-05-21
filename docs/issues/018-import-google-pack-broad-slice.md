# 018: Import Google Pack Broad Slice

## Type

AFK.

## What to build

Import every Google Takeout/Data Portability source that fits the current canonical event model without inventing the identity graph, precise location model, or secrets/configuration model too early.

## Implemented

- [x] Chrome history imports browser visits as attention evidence.
- [x] Chrome bookmarks import saved references.
- [x] Chrome reading list imports saved references.
- [x] My Activity imports generic activity records.
- [x] YouTube watch/search history is covered by My Activity records.
- [x] Search activity is covered by My Activity records.
- [x] Maps activity is covered by My Activity records.

## Blockers Noted And Skipped

- [ ] Google Contacts: needs identity graph types before importing contact cards.
- [ ] Precise location timeline/trips: needs stricter location membranes and a location event model before importing coordinates/routes.
- [ ] Chrome Autofill: secrets-adjacent and identity-adjacent; needs classification rules before import.
- [ ] Chrome settings/extensions/dictionary: configuration/state data, not current event evidence; needs a separate configuration snapshot model.
- [ ] My Activity binary attachments: current slice records file references only, not image/audio/blob payload ingestion.

## Notes

The implemented Google sources preserve provenance as Google Takeout lineage. URL-like fields are stored as `artifactId` pointers. These are attention/saved-reference/activity records, not proof of the referenced page content.
