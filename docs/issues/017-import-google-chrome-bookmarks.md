# 017: Import Google Chrome Bookmarks

## Type

AFK.

## What to build

Import Chrome bookmarks from the Google Takeout/Data Portability Netscape bookmarks HTML file as saved-reference events.

## Acceptance Criteria

- [x] Add a Chrome bookmarks fixture in Netscape bookmark HTML format.
- [x] Parse bookmark title, URL, add date, and icon URI.
- [x] Reject bookmark files with no bookmark links.
- [x] Define a required-field Chrome bookmark normalization input.
- [x] Import one Chrome bookmark into the canonical event model.
- [x] Preserve URL as the event artifact id.
- [x] Record provenance as Google Takeout saved-reference evidence.

## Notes

Bookmarks are saved-reference evidence. They say Peter saved a URL at a time. They do not import or independently prove page content.
