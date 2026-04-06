const tokenStorageKey = "voidlab-session-token";

export const getStoredSessionToken = () => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(tokenStorageKey) ?? "";
};

export const storeSessionToken = (token: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(tokenStorageKey, token);
};

export const clearStoredSessionToken = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(tokenStorageKey);
};

export const buildAuthHeaders = () => {
  const token = getStoredSessionToken();

  return token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : {};
};
