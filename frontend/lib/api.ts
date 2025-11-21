// lib/api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set');
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // Try to read error message
    let message = 'Request failed';
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
