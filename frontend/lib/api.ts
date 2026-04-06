const configuredBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "";
export const BASE_URL = configuredBaseUrl.endsWith("/")
  ? configuredBaseUrl.slice(0, -1)
  : configuredBaseUrl;

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