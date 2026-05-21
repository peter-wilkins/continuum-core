import { canonicalEventSchema, type EventSchema } from "../../src/schema/canonical-event-schema";
import "./styles.css";
import { gitHash } from "virtual:continuum-git-hash";

function fieldCount(schema: EventSchema): number {
  return schema.sections.reduce(
    (total, section) => total + section.fields.length,
    0,
  );
}

function renderSection(section: EventSchema["sections"][number]): string {
  const fields = section.fields
    .map(
      (field) => `
        <tr>
          <td><code>${field.name}</code></td>
          <td><code>${field.type}</code></td>
          <td>${field.required ? "yes" : "no"}</td>
          <td>${field.description}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <section class="schema-card">
      <h2>${section.name}</h2>
      <p>${section.purpose}</p>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Required</th>
            <th>Why it exists</th>
          </tr>
        </thead>
        <tbody>${fields}</tbody>
      </table>
    </section>
  `;
}

function renderDiagram(schema: EventSchema): string {
  const sectionNodes = schema.sections
    .map(
      (section, index) => `
        <g transform="translate(${80 + index * 250}, 170)">
          <rect width="210" height="96" rx="8" />
          <text x="18" y="34" class="node-title">${section.name}</text>
          <text x="18" y="62">${section.fields.length} fields</text>
        </g>
      `,
    )
    .join("");

  const lines = schema.sections
    .map((_, index) => {
      const x = 185 + index * 250;
      return `<line x1="520" y1="105" x2="${x}" y2="170" />`;
    })
    .join("");

  return `
    <section class="diagram-card">
      <h2>Event Shape</h2>
      <svg viewBox="0 0 1040 330" role="img" aria-label="Canonical event schema diagram">
        <g class="link-lines">${lines}</g>
        <g transform="translate(405, 35)">
          <rect width="230" height="70" rx="8" />
          <text x="22" y="42" class="node-title">${schema.name}</text>
        </g>
        ${sectionNodes}
      </svg>
    </section>
  `;
}

function renderRelations(schema: EventSchema): string {
  return schema.relations
    .map(
      (relation) => `
        <li>
          <code>${relation.from}</code>
          <span>-></span>
          <code>${relation.to}</code>
          <small>${relation.label}</small>
        </li>
      `,
    )
    .join("");
}

function renderApp(schema: EventSchema): string {
  return `
    <header class="page-header">
      <div>
        <p class="eyebrow">Continuum schema workbench</p>
        <h1>${schema.name}</h1>
        <p>${schema.purpose}</p>
        <p class="git-hash">Git <code>${gitHash}</code></p>
      </div>
      <dl>
        <div>
          <dt>Sections</dt>
          <dd>${schema.sections.length}</dd>
        </div>
        <div>
          <dt>Fields</dt>
          <dd>${fieldCount(schema)}</dd>
        </div>
      </dl>
    </header>

    ${renderDiagram(schema)}

    <section class="relations-card">
      <h2>Important Relations</h2>
      <ul>${renderRelations(schema)}</ul>
    </section>

    <div class="schema-grid">
      ${schema.sections.map(renderSection).join("")}
    </div>
  `;
}

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root");
}

app.innerHTML = renderApp(canonicalEventSchema);
