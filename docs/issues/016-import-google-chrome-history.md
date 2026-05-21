# 016: Import Google Chrome History

## Type

AFK.

## What to build

Split Google Takeout into concrete source families and implement the first Google source: Chrome browser history visits.

## Acceptance Criteria

- [x] Add Chrome history to the active source catalogue.
- [x] Keep Chrome bookmarks, My Activity/Search/Gemini, YouTube history, Contacts, and Maps/location as separate targets.
- [x] Define a required-field Chrome history normalization input.
- [x] Validate the Google Takeout/Data Portability `Browser History` JSON shape with Zod.
- [x] Reject encrypted placeholder records instead of normalizing them.
- [x] Import one Chrome browser history visit into the canonical event model.
- [x] Preserve URL as the event artifact id.
- [x] Record provenance as Google Takeout activity evidence.

## Notes

Chrome history is attention evidence. It says Peter visited a URL at a time. It does not import or independently prove the page content at that URL.

Bookmarks should be next if we want saved-reference evidence. Contacts should wait until we name the identity graph model. Maps/location needs stricter membrane defaults.
