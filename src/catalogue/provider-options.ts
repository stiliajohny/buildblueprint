import { byId } from "@/catalogue";

export const authMethodIds = [
  "email",
  "magic-link",
  "email-otp",
  "phone",
  "google",
  "apple",
  "facebook",
  "linkedin",
  "github",
  "microsoft",
  "discord",
  "anonymous",
  "passkey",
  "sso",
] as const;

export type AuthMethodId = (typeof authMethodIds)[number];

const authMethodLabels: Record<AuthMethodId, string> = {
  email: "Email and password",
  "magic-link": "Magic link",
  "email-otp": "Email code",
  phone: "Phone",
  google: "Google",
  apple: "Apple",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  github: "GitHub",
  microsoft: "Microsoft",
  discord: "Discord",
  anonymous: "Anonymous",
  passkey: "Passkey",
  sso: "Enterprise SSO",
};

/** Sign-in methods each identity provider actually offers. */
const authOptions: Record<string, readonly AuthMethodId[]> = {
  "supabase-auth": [
    "email",
    "magic-link",
    "email-otp",
    "phone",
    "google",
    "apple",
    "facebook",
    "linkedin",
    "github",
    "discord",
    "anonymous",
    "passkey",
  ],
  "firebase-auth": [
    "email",
    "magic-link",
    "phone",
    "google",
    "apple",
    "facebook",
    "github",
    "microsoft",
    "anonymous",
    "passkey",
  ],
  clerk: [
    "email",
    "magic-link",
    "email-otp",
    "phone",
    "google",
    "apple",
    "facebook",
    "linkedin",
    "github",
    "microsoft",
    "discord",
    "passkey",
  ],
  auth0: [
    "email",
    "magic-link",
    "email-otp",
    "phone",
    "google",
    "apple",
    "facebook",
    "linkedin",
    "github",
    "microsoft",
    "passkey",
    "sso",
  ],
  "better-auth": [
    "email",
    "magic-link",
    "email-otp",
    "phone",
    "google",
    "apple",
    "facebook",
    "linkedin",
    "github",
    "microsoft",
    "discord",
    "anonymous",
    "passkey",
  ],
  authjs: [
    "email",
    "magic-link",
    "google",
    "apple",
    "facebook",
    "linkedin",
    "github",
    "microsoft",
    "discord",
  ],
  workos: [
    "email",
    "email-otp",
    "google",
    "apple",
    "github",
    "microsoft",
    "passkey",
    "sso",
  ],
  cognito: [
    "email",
    "email-otp",
    "phone",
    "google",
    "apple",
    "facebook",
    "passkey",
    "sso",
  ],
  keycloak: [
    "email",
    "email-otp",
    "google",
    "apple",
    "facebook",
    "github",
    "microsoft",
    "passkey",
    "sso",
  ],
  ory: [
    "email",
    "email-otp",
    "phone",
    "google",
    "apple",
    "facebook",
    "github",
    "microsoft",
    "passkey",
    "sso",
  ],
};

export type ProviderOption = { id: string; label: string };

/** Capabilities that differ between AI providers. */
const aiOptions: Record<string, readonly ProviderOption[]> = {
  openai: [
    { id: "chat", label: "Chat" },
    { id: "embeddings", label: "Embeddings" },
    { id: "images", label: "Image generation" },
    { id: "speech", label: "Speech" },
    { id: "realtime", label: "Realtime voice" },
  ],
  anthropic: [
    { id: "chat", label: "Chat" },
    { id: "vision", label: "Image understanding" },
  ],
  gemini: [
    { id: "chat", label: "Chat" },
    { id: "embeddings", label: "Embeddings" },
    { id: "images", label: "Image generation" },
    { id: "speech", label: "Speech" },
    { id: "video", label: "Video understanding" },
  ],
  mistral: [
    { id: "chat", label: "Chat" },
    { id: "embeddings", label: "Embeddings" },
    { id: "vision", label: "Image understanding" },
  ],
  groq: [
    { id: "chat", label: "Chat" },
    { id: "speech", label: "Speech" },
  ],
  deepseek: [
    { id: "chat", label: "Chat" },
    { id: "reasoning", label: "Reasoning" },
  ],
  ollama: [
    { id: "chat", label: "Chat" },
    { id: "embeddings", label: "Embeddings" },
    { id: "vision", label: "Image understanding" },
  ],
  "browser-ai": [
    { id: "text", label: "On-device text" },
    { id: "embeddings", label: "Embeddings" },
    { id: "speech", label: "Speech" },
    { id: "vision", label: "Image understanding" },
  ],
};

/** Options shown for one selected provider. Empty when that provider has no checklist. */
export function optionsFor(technologyId: string): ProviderOption[] {
  const auth = authOptions[technologyId];
  if (auth) return auth.map((id) => ({ id, label: authMethodLabels[id] }));
  return [...(aiOptions[technologyId] ?? [])];
}

/** Auth methods to write into the pack for the providers that are selected. */
export function resolvedAuthMethods(
  technologyIds: string[],
  selectedAuthMethods: readonly string[],
  selectedProviderOptions: Readonly<Record<string, readonly string[]>>,
) {
  const providers = technologyIds.filter((id) => byId[id]?.category === "auth");
  const methods = providers.flatMap((id) => {
    const allowed = new Set<string>(authOptions[id] ?? []);
    const source =
      id in selectedProviderOptions
        ? selectedProviderOptions[id]
        : selectedAuthMethods;
    return source.filter((method): method is AuthMethodId =>
      allowed.has(method),
    );
  });
  return [...new Set(methods)];
}

/** AI capability ids to keep for one selected provider. */
export function resolvedAiOptions(
  technologyId: string,
  selected: readonly string[] | undefined,
) {
  const allowed = new Set(
    (aiOptions[technologyId] ?? []).map((item) => item.id),
  );
  return (selected ?? []).filter((id) => allowed.has(id));
}

const securityControls = [
  {
    id: "rls",
    label: "Row-level access control",
    applies: (ids: string[]) =>
      ids.some(
        (id) =>
          id === "supabase" || id === "postgresql" || id === "supabase-db",
      ),
  },
  {
    id: "validation",
    label: "Validate external input",
    applies: () => true,
  },
  {
    id: "secrets",
    label: "Server-side secret management",
    applies: (ids: string[]) => ids.some((id) => byId[id]?.deployment.saas),
  },
  {
    id: "rate-limiting",
    label: "API rate limits",
    applies: (ids: string[]) =>
      ids.some((id) =>
        ["frontend", "backend", "auth"].includes(byId[id]?.category ?? ""),
      ),
  },
  {
    id: "backups",
    label: "Backups and restore tests",
    applies: (ids: string[]) =>
      ids.some((id) => byId[id]?.category === "database"),
  },
  {
    id: "audit",
    label: "Audit logging",
    applies: (ids: string[]) =>
      ids.some((id) => byId[id]?.category === "auth" || id === "supabase"),
  },
  {
    id: "csp",
    label: "Content Security Policy",
    applies: (ids: string[]) =>
      ids.some((id) => byId[id]?.category === "frontend"),
  },
] as const;

/** Security controls that apply to the technologies currently selected. */
export function securityControlsFor(technologyIds: string[]) {
  return securityControls.filter((control) => control.applies(technologyIds));
}
