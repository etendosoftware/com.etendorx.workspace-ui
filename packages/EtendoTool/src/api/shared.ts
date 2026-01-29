const API_BASE_URL = (import.meta.env.VITE_JAVA_RUNTIME_API as string | undefined) ?? "/api";

const buildUrl = (endpoint: string) => {
  const cleanedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanedEndpoint}`;
};

export async function apiRequest<T>(endpoint: string, options: RequestInit) {
  const response = await fetch(buildUrl(endpoint), {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === "string" ? payload : payload?.message;
    throw new Error(message ?? "No se pudo comunicar con la API.");
  }

  return payload as T;
}
