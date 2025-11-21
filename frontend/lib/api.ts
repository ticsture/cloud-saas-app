// lib/api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

// Plain POST without auth – for login/signup etc.
export async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let message = "Request failed";
    try {
      const data = await res.json();
      if (data.message) message = data.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return res.json();
}

// Helper: get auth token from localStorage (browser only)
function getAuthToken(): string {
  if (typeof window === "undefined") {
    throw new Error("No window object (not in browser)");
  }
  const token = localStorage.getItem("authToken");
  if (!token) {
    throw new Error("No auth token found");
  }
  return token;
}

// Auth GET
export async function apiGetAuth<T>(path: string): Promise<T> {
  const token = getAuthToken();

  const res = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Auth GET request failed");
  }

  return res.json();
}

// Auth POST (JSON)
export async function apiPostAuth<T>(path: string, body: any): Promise<T> {
  const token = getAuthToken();

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Auth POST request failed");
  }

  return res.json();
}

// Auth PUT (JSON)
export async function apiPutAuth<T>(path: string, body: any): Promise<T> {
  const token = getAuthToken();

  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Auth PUT request failed");
  }

  return res.json();
}
