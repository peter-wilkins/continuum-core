# Future Concept: Clipboard Continuity

## Status

Shelved for now. Valuable idea, but not part of the immediate core build.

## Core insight

Clipboard integration should not be framed as "clipboard history with AI".

The stronger idea is:

> Predictive paste as continuity.

A normal clipboard manager says:

> Here is everything you copied.

Continuum should aim for:

> Here is the thing you probably meant to paste next.

## Why phones matter

Clipboard workflows are especially painful on phones because:

- switching apps is slow
- selecting text is fiddly
- clipboard history is mostly hidden
- mobile context is fragile
- keyboards are the real insertion point

## Possible behaviours

Examples:

- Copy a tracking number -> suggest a parcel lookup or message draft
- Copy a product model -> retrieve prior discussion, warranty notes, buying context
- Copy an address -> retrieve job/customer/property context
- Copy a half-written message -> suggest continuation using current Continuation context
- Copy a GitHub issue -> retrieve related repo/task context

## Possible surfaces

Android is likely the better early playground.

Potential surfaces:

- keyboard suggestion strip
- share sheet
- notification action
- floating bubble
- custom input method
- app-level paste action

## Privacy constraints

Clipboard data can include highly sensitive material:

- passwords
- 2FA codes
- bank details
- private messages
- addresses
- medical/legal/financial information

Default behaviour should be conservative:

- detect secrets
- avoid storing sensitive clips
- support instant forget
- prefer local processing where practical
- make retention explicit

## Architectural sketch

```txt
adapters/clipboard/
  observe copied text
  classify clipboard intent
  retrieve relevant context
  generate paste candidates
  apply privacy filters
```

## Product warning

Do not build a generic clipboard history app.

The valuable behaviour is prediction and continuity, not archival browsing.
