import { apiBaseUrl } from "@/lib/api";

export type OAuthProvider = "github" | "google" | "x";

export const buildOAuthStartUrl = (
  provider: OAuthProvider,
  options?: { intent?: "link" | "login"; returnTo?: string },
) => {
  const url = new URL(`${apiBaseUrl}/api/auth/${provider}`);
  url.searchParams.set("intent", options?.intent ?? "login");
  url.searchParams.set("returnTo", options?.returnTo ?? "/editor");
  return url.toString();
};
