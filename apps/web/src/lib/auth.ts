import { apiBaseUrl } from "@/lib/api";

export type OAuthProvider = "github" | "google" | "x";

export const buildOAuthStartUrl = (
  provider: OAuthProvider,
  options?: { appToken?: string; intent?: "link" | "login"; returnTo?: string },
) => {
  const url = new URL(`${apiBaseUrl}/api/auth/${provider}`);
  url.searchParams.set("intent", options?.intent ?? "login");
  url.searchParams.set("returnTo", options?.returnTo ?? "/editor");
  if (options?.appToken) {
    url.searchParams.set("appToken", options.appToken);
  }
  return url.toString();
};
