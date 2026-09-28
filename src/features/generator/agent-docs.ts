import { byId } from "@/catalogue";

const SECRET_KEYS: Record<string, string[]> = {
  supabase: [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ],
  openai: ["OPENAI_API_KEY"],
  deepseek: ["DEEPSEEK_API_KEY"],
  stripe: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
  resend: ["RESEND_API_KEY"],
  sentry: ["NEXT_PUBLIC_SENTRY_DSN"],
  r2: ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"],
  postgresql: ["DATABASE_URL"],
  ollama: ["OLLAMA_ENDPOINT"],
};

const CLOUD_AI = [
  "openai",
  "deepseek",
  "anthropic",
  "gemini",
  "mistral",
  "groq",
];
const VALIDATORS = ["zod", "valibot", "yup", "arktype"];
const POSTGRES = ["postgresql", "supabase-db", "neon"];
const OTHER_SQL = ["mysql", "sqlite", "d1", "turso"];

export type AgentDocInput = {
  name: string;
  has: (id: string) => boolean;
  authProviders: string[];
  authMethods: string[];
  databases: string[];
  web: string[];
  ui: string[];
  frontendLibraries: string[];
  ai: string[];
  payments: string[];
  storage: string[];
  email: string[];
  deployment: string[];
  security: string[];
  packageManager: string;
};

/** Placeholder env names for technologies present in the stack. */
export function secretPlaceholders(has: (id: string) => boolean) {
  return Object.entries(SECRET_KEYS).flatMap(([id, keys]) =>
    has(id) ? keys : [],
  );
}

function title(ids: string[]) {
  const names = ids.map((id) => byId[id]?.name ?? id);
  return names.length ? names.join(", ") : "";
}

function bullets(lines: string[]) {
  return lines.map((line) => `- ${line}`).join("\n");
}

function selected(input: AgentDocInput, ids: string[]) {
  return ids.filter((id) => input.has(id));
}

/** Security, style, data, and API context included in a downloaded pack. */
export function agentDocs(input: AgentDocInput): Record<string, string> {
  return {
    "docs/SECURITY.md": securityDoc(input),
    "docs/CODE_STYLE.md": styleDoc(input),
    "docs/DATABASE.md": databaseDoc(input),
    "docs/API.md": apiDoc(input),
    "docs/THREAT_MODEL.md": threatDoc(input),
    "docs/SECURITY_ARCHITECTURE.md": architectureDoc(input),
    "docs/SECURITY_CHECKLIST.md": checklistDoc(input),
  };
}

function securityDoc(input: AgentDocInput) {
  const auth = title(input.authProviders);
  const methods = input.authMethods.join(", ");
  const validator = title(selected(input, VALIDATORS));
  const secrets = secretPlaceholders(input.has);
  const publicKeys = secrets.filter((key) => key.startsWith("NEXT_PUBLIC_"));
  const serverKeys = secrets.filter((key) => !key.startsWith("NEXT_PUBLIC_"));
  const lines = [
    `# SECURITY.md`,
    ``,
    `Security requirements for ${input.name}. Follow STACK.yaml. Do not add a provider or control that this file does not name.`,
    ``,
    `## Principles`,
    bullets([
      "Authenticate and authorize on the server. Browser state and model output are untrusted.",
      "If an auth, validation, or quota check fails, deny the action.",
      "Give each credential the smallest access that still performs its job.",
    ]),
  ];
  lines.push(``, `## Authentication`);
  if (auth) {
    lines.push(
      bullets([
        `Use ${auth}${methods ? ` with ${methods}` : ""}.`,
        "Verify the session on the server for protected actions. Do not trust a user id sent only from the client.",
        "Keep the session in an HttpOnly, Secure, SameSite cookie issued by that provider. Do not copy access tokens into localStorage or sessionStorage.",
        "Do not store password hashes in an application table. Configure the provider's password policy to at least 12 characters before public launch.",
        "This pack has no admin role. Do not add privileged routes unless PROJECT.md asks for them.",
      ]),
    );
  } else {
    lines.push(
      "No authentication provider is selected. Do not add accounts unless PROJECT.md requires them.",
    );
  }
  lines.push(``, `## Authorization`);
  if (input.security.includes("rls") || input.has("supabase")) {
    lines.push(
      bullets([
        "Enable row level security on every table that stores one person's data.",
        "Policies must match the signed-in user. Also filter queries by that owner in application code.",
        "Return 404 when a row exists but belongs to someone else.",
      ]),
    );
  } else if (input.databases.length || auth) {
    lines.push(
      "Filter every stored record by the authenticated owner in the data access layer. Do not rely on hiding buttons.",
    );
  } else {
    lines.push(
      "No shared tenant data is selected. If you later store per-user records, filter them by the authenticated owner.",
    );
  }
  lines.push(``, `## Input validation`);
  if (validator) {
    lines.push(
      `Validate every request body, path id, and query value with ${validator} on the server. Reject unexpected fields.`,
    );
  } else if (input.security.includes("validation")) {
    lines.push(
      "Validate every request body, path id, and query value on the server with a schema. Reject unexpected fields.",
    );
  } else {
    lines.push(
      "Schema validation is not selected. Add server-side validation before accepting a write.",
    );
  }
  lines.push(
    "Use parameterized queries or the selected database client. Do not concatenate request text into SQL or document queries.",
  );
  lines.push(``, `## Secrets`);
  if (secrets.length) {
    lines.push(
      "Store these in the host environment. Commit names only, in `.env.example`.",
      ``,
    );
    if (publicKeys.length)
      lines.push(`Public configuration: ${publicKeys.join(", ")}.`, ``);
    if (serverKeys.length)
      lines.push(
        `Server only: ${serverKeys.join(", ")}. Never prefix these with a public env name.`,
        ``,
      );
  } else {
    lines.push(
      "No service credentials are selected. Do not add secret env vars without updating STACK.yaml and `.env.example`.",
      ``,
    );
  }
  lines.push("Do not put real keys in source or Markdown.");
  if (input.ai.length) {
    const cloud = title(selected(input, CLOUD_AI));
    lines.push(``, `## AI`);
    const aiLines = [
      "Treat model output as untrusted. Keep system instructions separate from user text.",
      "Do not give a model a tool that writes or deletes data on its own.",
    ];
    if (cloud)
      aiLines.push(
        `Call ${cloud} from the server with the server key. Require a signed-in user when the action spends quota, cap output tokens, and fail closed when the limit is reached.`,
      );
    if (input.has("browser-ai"))
      aiLines.push(
        "Run browser inference in a worker. Show the model size and licence, and wait for download consent. Do not post those prompts to an application API.",
      );
    if (input.has("ollama"))
      aiLines.push(
        "Call Ollama on loopback only. Do not expose an unauthenticated Ollama server.",
      );
    lines.push(bullets(aiLines));
  }
  if (input.storage.length) {
    lines.push(
      ``,
      `## Files`,
      bullets([
        `Store uploads in ${title(input.storage)}.`,
        "Check file contents on the server, cap the size, and store objects under a generated id in a private bucket.",
      ]),
    );
  }
  if (input.payments.length) {
    lines.push(
      ``,
      `## Payments`,
      `Verify ${title(input.payments)} webhook signatures on the server and make handling idempotent.`,
    );
  }
  if (input.security.includes("rate-limiting") || input.ai.length) {
    lines.push(
      ``,
      `## Rate limits`,
      "Limit authentication attempts, writes, and paid model calls per user. Respond with HTTP 429 and do not run the action when the limiter fails.",
    );
  }
  if (input.web.length) {
    lines.push(
      ``,
      `## HTTP headers`,
      bullets([
        "Send X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, and X-Frame-Options: DENY.",
        "Set HSTS on the HTTPS host.",
        input.security.includes("csp")
          ? "Add a Content-Security-Policy and test it against the selected framework before launch."
          : "Content-Security-Policy is not selected. Add one only after testing it against the selected framework.",
      ]),
    );
  }
  lines.push(
    ``,
    `## Agents must not`,
    bullets([
      "Hardcode credentials or disable an auth check to finish a feature.",
      "Invent an admin role, file upload flow, or payment webhook that this stack does not include.",
      "Return stack traces, queries, or secrets to the client.",
    ]),
  );
  return lines.join("\n") + "\n";
}

function styleDoc(input: AgentDocInput) {
  const web = title(input.web);
  const ui = title([...input.ui, ...input.frontendLibraries]);
  const lines = [
    `# CODE_STYLE.md`,
    ``,
    `Conventions for ${input.name}. Match the selected stack in STACK.yaml.`,
    ``,
    `## Stack`,
  ];
  if (web) lines.push(`- Web: ${web}.`);
  if (ui) lines.push(`- UI and client libraries: ${ui}.`);
  if (input.web.length)
    lines.push(`- JavaScript package manager: ${input.packageManager}.`);
  if (input.has("nextjs"))
    lines.push(
      "- Use the App Router. Prefer Server Components. Add a client boundary only for state and browser APIs.",
    );
  lines.push(
    ``,
    `## Names`,
    bullets([
      "Component functions use PascalCase.",
      "Functions and variables use camelCase.",
      "Files use kebab-case.",
      "Booleans read as states, such as isLoading or canEdit.",
    ]),
    ``,
    `## Structure`,
    bullets([
      "Keep UI separate from data access and domain rules.",
      "Reuse an existing component before adding another.",
      "Give exported props a type.",
      "Handle loading, error, and empty states on screens that wait on data.",
      "Comment why a non-obvious branch exists. Do not comment an obvious assignment.",
    ]),
    ``,
    `## Before finishing`,
    input.web.length
      ? `Run typecheck, tests, and the formatter with ${input.packageManager}. Check the layout you changed at a narrow width and at desktop width.`
      : "Run the selected toolchain's tests and type checks.",
  );
  return lines.join("\n") + "\n";
}

function databaseDoc(input: AgentDocInput) {
  const lines = [
    `# DATABASE.md`,
    ``,
    `How ${input.name} stores data. Update this file in the same change as a schema change.`,
    ``,
  ];
  if (!input.databases.length) {
    lines.push(
      "No database is selected in STACK.yaml.",
      "",
      "Do not add a database unless PROJECT.md requires stored data. If you add one, record the provider, tables, ownership rule, and migration steps here.",
    );
    return lines.join("\n") + "\n";
  }
  lines.push(`## Provider`, `Selected: ${title(input.databases)}.`, ``);
  const postgres = selected(input, POSTGRES);
  const otherSql = selected(input, OTHER_SQL);
  const documents = selected(input, ["mongodb", "firestore"]);
  if (postgres.length || otherSql.length) {
    lines.push(
      `## SQL`,
      bullets([
        "Change the schema with a migration. Do not edit production by hand.",
        "Use foreign keys for relationships and a unique constraint for values that must be unique.",
        "Add an index when a query filters or sorts on that column.",
        input.security.includes("rls") || input.has("supabase")
          ? "Enable row level security, or an equivalent owner policy, on tables that hold one person's rows."
          : "Filter tenant rows by the authenticated owner in every query.",
      ]),
      ``,
    );
  }
  if (documents.length) {
    lines.push(
      `## Documents`,
      `For ${title(documents)}, store the owner id on every tenant document and apply it in every query.`,
      ``,
    );
  }
  if (input.has("supabase")) {
    lines.push(
      "Use hosted Supabase for the project. Keep migrations in the repository and apply them to that project. The client may use the publishable key with the user session. Do not ship the service-role key.",
      ``,
    );
  }
  lines.push(
    "## Models",
    "No tables are defined yet. Add a table only for a requirement in PROJECT.md, then list its columns, owner, and relationships in this section.",
    "",
    "Do not copy a sample user or project schema that this product does not need.",
  );
  return lines.join("\n") + "\n";
}

function apiDoc(input: AgentDocInput) {
  const lines = [
    `# API.md`,
    ``,
    `How ${input.name} talks to its backend and to selected providers. Add a route here when you create it.`,
    ``,
    `## Conventions`,
    bullets([
      input.has("nextjs")
        ? "Use App Router route handlers. Return JSON."
        : "Return JSON from the selected server boundary.",
      'Errors use `{ "error": "short message" }`. Do not return stack traces, queries, or secrets.',
      "Validate inputs with the rule in docs/SECURITY.md.",
      "Use 400 for invalid input, 401 when authentication is required and missing, 403 when the caller is not allowed, 404 when a resource is missing or not owned, and 429 when a limit is exceeded.",
    ]),
  ];
  if (input.authProviders.length) {
    lines.push(
      ``,
      `## Authentication`,
      `Protected actions use the ${title(input.authProviders)} server session. Do not accept a user id from the client as proof of identity.`,
    );
  }
  const integrations = [
    ...input.payments,
    ...input.email,
    ...selected(input, CLOUD_AI),
    ...input.storage,
  ];
  if (integrations.length) {
    const keys = secretPlaceholders(input.has);
    lines.push(``, `## Selected providers`, title(integrations) + ".");
    if (keys.length)
      lines.push(``, `Environment names, without values: ${keys.join(", ")}.`);
  }
  if (input.has("ollama"))
    lines.push(
      ``,
      "Ollama is called on loopback from the client, not through a public route.",
    );
  lines.push(
    ``,
    `## Routes`,
    "None are specified yet. When you add one, record the method, path, auth requirement, request fields, and response here.",
  );
  return lines.join("\n") + "\n";
}

function threatDoc(input: AgentDocInput) {
  const rows: string[] = [
    "| ID | Threat | What to do |",
    "| --- | --- | --- |",
  ];
  if (input.authProviders.length)
    rows.push(
      "| TH-01 | Stolen session used as the victim | Keep the provider session in an HttpOnly cookie. |",
    );
  if (input.databases.length)
    rows.push(
      "| TH-02 | Query built from request text | Use the database client or parameterized statements. |",
      "| TH-03 | One user opens another user's record | Filter by owner and return 404 for a foreign id. |",
    );
  if (input.ai.length)
    rows.push(
      "| TH-04 | User text overrides system instructions | Keep system and user content in separate channels. The model only returns text unless a later change adds a confirmed action. |",
      "| TH-05 | A model tool changes stored data | Do not add a write tool. If you add one later, run it as the signed-in user. |",
    );
  if (selected(input, CLOUD_AI).length)
    rows.push(
      "| TH-06 | Repeated model calls spend the provider budget | Require auth, cap tokens, and fail closed when the per-user limit is reached. |",
    );
  if (input.storage.length)
    rows.push(
      "| TH-07 | Uploaded file is active content | Validate contents on the server and store the object as a private generated id. |",
    );
  rows.push(
    "| TH-08 | Server key shipped to the browser | Public env names are limited to the public keys listed in docs/SECURITY.md. |",
  );
  if (input.has("ollama"))
    rows.push(
      "| TH-09 | Ollama is reachable off the machine | Keep the endpoint on loopback. |",
    );
  rows.push(
    "| TH-10 | A new dependency is vulnerable or unused | Add a package only when STACK.yaml already needs that capability. |",
  );
  return [
    `# THREAT_MODEL.md`,
    ``,
    `Threats for ${input.name}, limited to the selected stack.`,
    ``,
    ...rows,
    ``,
    `Before a query, satisfy TH-02 and TH-03 when those rows exist. Before a route that reads user data or calls a paid model, require the server session and the validation rule in docs/SECURITY.md. Do not drop an ownership check to silence an error.`,
    ``,
  ].join("\n");
}

function architectureDoc(input: AgentDocInput) {
  const lines = [
    `# SECURITY_ARCHITECTURE.md`,
    ``,
    `Boundaries for ${input.name}.`,
    ``,
    `## Browser`,
    input.web.length
      ? `The web client uses ${title(input.web)}. It may render UI state. It does not decide who owns a stored record.`
      : "No web client is selected.",
    ``,
    `## Server`,
    input.deployment.length
      ? `Host the application on ${title(input.deployment)}. Validate input and check the session before a protected action.`
      : "Validate input and check the session before a protected action.",
  ];
  if (input.databases.length) {
    lines.push(
      ``,
      `## Data`,
      `${title(input.databases)} is the store. Ownership is enforced in the database policy when row level security is selected, and in every query either way.`,
    );
  }
  if (input.ai.length) {
    lines.push(``, `## Models`, title(input.ai) + ".");
    if (selected(input, CLOUD_AI).length)
      lines.push(
        "Cloud calls leave from the server with the server key and return text.",
      );
    if (input.has("browser-ai"))
      lines.push(
        "Browser inference stays in a worker and does not call application APIs with the prompt.",
      );
  }
  lines.push(
    ``,
    `## Least privilege`,
    "Anonymous visitors can use only the flows PROJECT.md leaves public. A signed-in user can reach only their own records. Provider keys stay on the server.",
  );
  return lines.join("\n") + "\n";
}

function checklistDoc(input: AgentDocInput) {
  const rows = [
    ["Item", "Applies"],
    ["---", "---"],
  ];
  const add = (item: string, applies: string) => rows.push([item, applies]);
  if (input.authProviders.length) {
    add("Server session checked on protected actions", "Yes");
    add("Session cookie is HttpOnly", "Yes");
    add(
      "Provider password policy is at least 12 characters",
      "Before public launch",
    );
  }
  if (
    (input.databases.length || input.has("supabase")) &&
    (input.security.includes("rls") || input.has("supabase"))
  )
    add("Row level security tested with two users", "Yes");
  if (input.databases.length) add("Foreign id returns 404", "Yes");
  add("`.env.example` has names only", "Yes");
  add("Server keys are absent from the client bundle", "Yes");
  if (
    input.security.includes("validation") ||
    selected(input, VALIDATORS).length
  )
    add("Invalid bodies return 400", "Yes");
  if (input.security.includes("rate-limiting") || input.ai.length)
    add("Limited routes return 429", "Yes");
  if (input.ai.length) add("Model output cannot write data by itself", "Yes");
  if (input.storage.length)
    add("Upload is checked and stored privately", "Yes");
  if (input.payments.length) add("Webhook signature is verified", "Yes");
  if (input.web.length)
    add("nosniff, referrer policy, and frame denial are set", "Yes");
  if (input.security.includes("csp"))
    add(
      "Content-Security-Policy tested in the browser",
      "Before public launch",
    );
  if (!input.storage.length) add("File upload handling", "Not in this stack");
  if (!input.payments.length) add("Payment webhooks", "Not in this stack");
  if (!input.ai.length)
    add("Model tools and provider spend caps", "Not in this stack");
  const body = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  return [
    `# SECURITY_CHECKLIST.md`,
    ``,
    `Launch check for ${input.name}. Complete every Yes row before a public release. Rows marked "Not in this stack" are not features to add.`,
    ``,
    body,
    ``,
  ].join("\n");
}
