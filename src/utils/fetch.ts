const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

export const fetcher = async <TRes>(
  input: string | URL | Request,
  options?: RequestInit
): Promise<TRes> => {
  // Convert input to string if it's not already
  const inputUrl =
    typeof input === "string"
      ? `${BACKEND_API_URL}${input.startsWith("/") ? input : `/${input}`}`
      : input;

  const res = await fetch(inputUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  return await (res.json() as Promise<TRes>);
};
