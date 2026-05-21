import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  normalizeICalendarEvent,
  parseICalendarEvents,
  type ICalendarEventNormalizationInput,
} from "./index";

const calendarFixture = readFileSync(
  fileURLToPath(new URL("./fixtures/calendar-one-event.ics", import.meta.url)),
  "utf8",
);

describe("iCalendar import", () => {
  it("parses one VEVENT from an iCalendar file", () => {
    expect(parseICalendarEvents(calendarFixture)).toEqual({
      ok: true,
      value: [
        {
          uid: "boiler-quote@example.com",
          dtstamp: "20260521T104203Z",
          dtstart: "20260522T090000Z",
          dtend: "20260522T093000Z",
          summary: "Boiler quote call",
          description: "Ask Bob whether the boiler is combi or system.",
          location: "Phone",
          attendees: [
            {
              name: "Peter Wilkins",
              address: "peter@example.com",
            },
            {
              name: "Bob",
              address: "bob@example.com",
            },
          ],
        },
      ],
    });
  });

  it("imports one iCalendar event into the canonical event model", () => {
    const parsed = parseICalendarEvents(calendarFixture);

    if (!parsed.ok) {
      throw new Error("Fixture should parse.");
    }

    const event = normalizeICalendarEvent({
      calendar: {
        path: "basic-event.ics",
      },
      event: parsed.value[0],
    } as ICalendarEventNormalizationInput);

    expect(event).toMatchObject({
      id: "icalendar:boiler-quote@example.com",
      source: {
        platform: "icalendar",
        key: "icalendar:boiler-quote@example.com",
        externalConversationId: "basic-event.ics",
        externalMessageId: "boiler-quote@example.com",
        artifactId: "boiler-quote@example.com",
        externalParentId: null,
        canonicalParentEventId: null,
      },
      provenance: {
        sourceFamily: "personal_schedule",
        sourceName: "icalendar",
        upstreamSources: [],
        derivedFrom: [],
        retrievedAt: "unknown",
        license: null,
      },
      time: {
        createdAt: "2026-05-22T09:00:00.000Z",
        createdAtConfidence: "exact",
      },
      actor: {
        role: "other",
      },
      participants: [
        {
          role: "attendee",
          name: "Peter Wilkins",
          address: "peter@example.com",
        },
        {
          role: "attendee",
          name: "Bob",
          address: "bob@example.com",
        },
      ],
      content: {
        kind: "text",
        subject: "Boiler quote call",
        text: [
          "Boiler quote call",
          "Ask Bob whether the boiler is combi or system.",
          "Location: Phone",
          "Ends: 2026-05-22T09:30:00.000Z",
        ].join("\n"),
      },
    });
    expect(event.source.fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });

  it("rejects a VEVENT missing a UID", () => {
    expect(
      parseICalendarEvents(
        "BEGIN:VEVENT\nDTSTART:20260522T090000Z\nSUMMARY:Missing UID\nEND:VEVENT",
      ),
    ).toEqual({
      ok: false,
      errors: [
        {
          path: "VEVENT.0.UID",
          message: "Required",
        },
      ],
    });
  });
});
