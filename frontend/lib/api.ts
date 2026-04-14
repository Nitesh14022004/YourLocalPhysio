const configuredBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "";
const localRuntimeFallback =
  typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)
    ? "http://localhost:5000"
    : "";
const resolvedBaseUrl = configuredBaseUrl || localRuntimeFallback;
export const BASE_URL = configuredBaseUrl.endsWith("/")
  ? configuredBaseUrl.slice(0, -1)
  : resolvedBaseUrl.endsWith("/")
    ? resolvedBaseUrl.slice(0, -1)
    : resolvedBaseUrl;

type ApiFetchOptions = RequestInit & {
  skipUnauthorizedRedirect?: boolean;
};

export const apiFetch = async (url: string, options: ApiFetchOptions = {}) => {
  const { skipUnauthorizedRedirect, ...requestOptions } = options;
  const token = window.localStorage.getItem("admin-token");

  const res = await fetch(url, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(requestOptions.headers || {}),
    },
  });

  if (res.status === 401 && !skipUnauthorizedRedirect) {
    window.localStorage.removeItem("admin-token");
    window.location.href = "/admin/login";
  }

  return res;
};