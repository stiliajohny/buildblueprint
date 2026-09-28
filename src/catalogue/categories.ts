export const steps = [
  ["project", "Project type", "What are you building?"],
  ["frontend", "Frontend & clients", "Web, mobile and desktop"],
  ["backend", "Backend & database", "Database, APIs and storage"],
  ["auth", "Authentication", "Providers and methods"],
  ["ai", "AI", "Models and providers"],
  ["payments", "Payments", "Billing and subscriptions"],
  ["analytics", "Analytics", "Product and marketing"],
  ["monitoring", "Monitoring", "Errors and observability"],
  ["features", "Feature flags", "Release and experimentation"],
  ["libraries", "Libraries", "Runtime, UI and libraries"],
  ["ui-style", "UI style", "Look of the interface"],
  ["appearance", "Colours & themes", "Theme and palette"],
  ["deployment", "Deployment", "Hosting and infrastructure"],
  ["automation", "Automation", "Pipelines and delivery"],
  ["security", "Security", "Best practices and tooling"],
  ["review", "Review", "Your project blueprint"],
] as const;
export const stepCategories: Record<string, string[]> = {
  frontend: ["frontend", "mobile", "desktop"],
  backend: ["backend", "database", "storage", "search"],
  auth: ["auth"],
  ai: ["ai"],
  payments: ["payments", "email"],
  analytics: ["analytics"],
  monitoring: ["monitoring"],
  features: ["feature-flags"],
  libraries: ["runtime", "ui", "frontend-library", "backend-library"],
  deployment: ["deployment", "infrastructure"],
  automation: ["ci", "cd"],
};
export function stepFor(category: string) {
  return (
    Object.entries(stepCategories).find(([, cats]) =>
      cats.includes(category),
    )?.[0] || "frontend"
  );
}
export const categoryLabels: Record<string, string> = {
  frontend: "Web framework",
  mobile: "Mobile applications",
  desktop: "Desktop applications",
  backend: "Backend platform",
  database: "Database",
  auth: "Identity provider",
  ui: "Component libraries",
  "frontend-library": "Frontend libraries",
  "backend-library": "Backend libraries",
  ai: "AI providers",
  payments: "Payments",
  email: "Email delivery",
  analytics: "Analytics",
  monitoring: "Monitoring",
  "feature-flags": "Feature flags",
  storage: "Object storage",
  search: "Search",
  infrastructure: "Infrastructure as code",
  deployment: "Hosting & edge",
  runtime: "JavaScript runtime",
  ci: "Continuous integration",
  cd: "Continuous delivery",
};
