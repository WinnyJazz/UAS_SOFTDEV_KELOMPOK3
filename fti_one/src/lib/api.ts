const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = {
  get: (path: string) => fetch(`${BASE_URL}${path}`),
  post: (path: string, body?: any) =>
    fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
};