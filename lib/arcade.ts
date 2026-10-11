// Server-only Arcade client. The API key never leaves the server.
// Docs: https://docs.arcade.ai/quickstart  — every request is a POST with a JSON body.

const BASE = "https://platform.arcade.ai/v1";
const UA = "Finite/1.0 (built on Arcade; hackathon)";

export const isLive = () => Boolean(process.env.ARCADE_API_KEY);

export class ArcadeError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

async function call<T>(path: string, body: unknown = {}): Promise<T> {
  const key = process.env.ARCADE_API_KEY;
  if (!key) throw new ArcadeError("Demo mode — no ARCADE_API_KEY set", 400);
  const res = await fetch(`${BASE}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "User-Agent": UA,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try {
      const j = JSON.parse(text);
      msg = j?.error?.message || j?.message || text;
    } catch {}
    throw new ArcadeError(`Arcade ${path} failed (${res.status}): ${String(msg).slice(0, 300)}`, res.status);
  }
  return JSON.parse(text) as T;
}

// ---- Types (from https://docs.arcade.ai/openapi.json) ----
export type Job = {
  jobId: string;
  kind: "pattern" | "product" | "download";
  status: "running" | "succeeded" | "failed";
  result: { patternId?: string; productId?: string } | null;
  error: { message: string } | null;
};
export type Category = {
  categoryId: string;
  name: string;
  imageUrl: string | null;
  world: "print" | "jewelry";
  category?: { categoryId: string; name: string };
};
export type CategoryDetail = {
  categoryId: string;
  name: string;
  world: "print" | "jewelry";
  options: { key: string; label: string; values: { value: string; label: string; isDefault: boolean; available: boolean }[] }[];
  selections: Record<string, string>;
  canManufacture: boolean;
};
export type Product = {
  productId: string;
  title: string;
  categoryId: string;
  maker: { makerId: string; name: string };
  selectionLabel: string;
  imageUrl: string;
  images: { url: string }[];
  patternId: string;
  unitPrice: { amount: string; currency: string } | null;
};

// ---- Calls ----
export const createPattern = (requestId: string, prompt: string, colors?: string[]) =>
  call<Job>("patterns/create", { requestId, prompt, ...(colors?.length ? { colors } : {}) });

export const getJob = (jobId: string) => call<Job>("jobs/get", { jobId });

export const getPattern = (patternId: string) =>
  call<{ patternId: string; imageUrl: string; thumbnailUrl: string; width: number; height: number }>(
    "patterns/get",
    { patternId }
  );

export const listCategories = () => call<{ items: Category[] }>("categories/list", {});

export const getCategory = (categoryId: string, selections: Record<string, string> = {}) =>
  call<CategoryDetail>("categories/get", { categoryId, selections });

export const createProduct = (
  requestId: string,
  patternId: string,
  categoryId: string,
  selections: Record<string, string>
) =>
  call<Job>("products/create", {
    requestId,
    patternId,
    categoryId,
    selections,
    // Required when the pattern's aspect ratio doesn't match the product size.
    fit: { mode: "fill" },
  });

export const getProduct = (productId: string) => call<Product>("products/get", { productId, quantity: 1 });

// One-of-one keepsakes are quantity 1 → dropShip must be true (else 412).
export const createCheckout = (requestId: string, productId: string, quantity = 1) =>
  call<{ checkoutId: string; checkoutUrl: string }>("checkouts/create", {
    requestId,
    lines: [{ productId, quantity }],
    dropShip: true,
  });

export const getOrder = (checkoutId: string) => call<Record<string, unknown>>("orders/get", { checkoutId });
