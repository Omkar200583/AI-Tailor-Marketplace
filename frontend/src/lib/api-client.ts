"use client";

type ApiOptions = {
  method?: string;
  body?: unknown;
};

export async function api<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const isFormData =
    typeof FormData !== "undefined" &&
    options.body instanceof FormData;

  const headers: HeadersInit = {};

  if (options.body && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`/api/v1${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body
      ? isFormData
        ? (options.body as FormData)
        : JSON.stringify(options.body)
      : undefined,
    credentials: "include",
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorData = data as {
      error?: string;
      message?: string;
    };

    throw new Error(
      errorData.message ||
      errorData.error ||
      `Request failed (${res.status})`
    );
  }

  return data as T;
}
