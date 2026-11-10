
"use client";

type ApiOptions = {
  method?: string;
  body?: unknown;
};

export class ApiError extends Error {
  status: number;
  details?: string;
  code?: string;

  constructor(
    message: string,
    status: number,
    details?: string,
    code?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

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
      details?: string;
      code?: string;
    };

    throw new ApiError(
      errorData.message || errorData.error || `Request failed (${res.status})`,
      res.status,
      errorData.details,
      errorData.code
    );
  }

  return data as T;
}

