import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as A from "@/lib/arcade";
import { demoJob, demoJobStatus, DEMO_CATEGORIES, demoCategory } from "@/lib/demo";

export const dynamic = "force-dynamic";

const ok = (data: unknown) => NextResponse.json(data);
// Belt and braces with middleware.ts: when login is required, the Arcade key is only spent for a signed-in user.
const unauthorized = async () =>
  process.env.REQUIRE_LOGIN !== "true" || (await getServerSession(authOptions))
    ? null
    : NextResponse.json({ error: "Sign in required" }, { status: 401 });

// Optional per-visitor cap (GENERATIONS_PER_HOUR) on the steps that spend Arcade credits.
// Off by default. In-memory, so it's per server instance — a speed bump, not a hard quota.
const LIMITED = new Set(["pattern", "product"]);
const LIMIT = Number(process.env.GENERATIONS_PER_HOUR || 0);
const hits = new Map<string, number[]>();
const rateLimited = (req: NextRequest, action: string) => {
  if (!LIMIT || !LIMITED.has(action)) return null;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 3_600_000);
  if (recent.length >= LIMIT) {
    return NextResponse.json({ error: "You've made a lot of designs this hour — please try again a little later." }, { status: 429 });
  }
  hits.set(ip, [...recent, now]);
  return null;
};

const fail = (e: unknown) => {
  const status = e instanceof A.ArcadeError ? e.status : 500;
  const message = e instanceof Error ? e.message : "Something went wrong";
  console.error("[arcade]", message);
  return NextResponse.json({ error: message }, { status: status >= 400 ? status : 500 });
};

// GET /api/arcade/health  → live/demo + category names (never the key)
export async function GET(_req: NextRequest, { params }: { params: { action: string } }) {
  const denied = await unauthorized();
  if (denied) return denied;
  if (params.action !== "health") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!A.isLive()) {
    return ok({ mode: "demo", count: DEMO_CATEGORIES.length, categories: DEMO_CATEGORIES.map((c) => c.name) });
  }
  try {
    const { items } = await A.listCategories();
    return ok({
      mode: "live",
      count: items.length,
      categories: items.map((c) => `${c.name} [${c.world}]`),
    });
  } catch (e) {
    return fail(e);
  }
}

// POST /api/arcade/<action>  with a JSON body. The browser polls; the server never blocks for minutes.
export async function POST(req: NextRequest, { params }: { params: { action: string } }) {
  const denied = await unauthorized();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const live = A.isLive();
  const limited = live ? rateLimited(req, params.action) : null;
  if (limited) return limited;
  try {
    switch (params.action) {
      case "pattern": {
        const { requestId, prompt, colors } = body;
        if (!live) return ok(demoJob("pattern", String(requestId).slice(-12)));
        return ok(await A.createPattern(requestId, prompt, colors));
      }
      case "job": {
        const { jobId } = body;
        if (String(jobId).startsWith("demo-")) return ok(demoJobStatus(jobId));
        return ok(await A.getJob(jobId));
      }
      case "pattern-image": {
        const { patternId } = body;
        if (String(patternId).startsWith("demo_")) return ok({ patternId, imageUrl: null, demo: true });
        return ok(await A.getPattern(patternId));
      }
      case "categories": {
        if (!live) return ok({ items: DEMO_CATEGORIES, mode: "demo" });
        const { items } = await A.listCategories();
        // Jewelry uses a separate flow (stretch) — only print categories in v1.
        return ok({ items: items.filter((c) => c.world === "print"), mode: "live" });
      }
      case "category": {
        const { categoryId, selections } = body;
        if (!live || String(categoryId).startsWith("demo-")) return ok(demoCategory(categoryId, selections || {}));
        return ok(await A.getCategory(categoryId, selections || {}));
      }
      case "product": {
        const { requestId, patternId, categoryId, selections } = body;
        if (!live || String(patternId).startsWith("demo_")) return ok(demoJob("product", String(requestId).slice(-12)));
        return ok(await A.createProduct(requestId, patternId, categoryId, selections));
      }
      case "product-get": {
        const { productId } = body;
        if (String(productId).startsWith("demo_")) {
          return ok({ productId, title: "Demo keepsake", demo: true, images: [], unitPrice: null, maker: { name: "Demo maker" }, selectionLabel: "" });
        }
        return ok(await A.getProduct(productId));
      }
      case "checkout": {
        const { requestId, productId } = body;
        if (String(productId).startsWith("demo_")) {
          return ok({ checkoutId: `demo${Date.now()}`, checkoutUrl: null, demo: true });
        }
        return ok(await A.createCheckout(requestId, productId, 1));
      }
      case "order": {
        const { checkoutId } = body;
        if (String(checkoutId).startsWith("demo")) return ok({ status: "Demo order — no real purchase made", demo: true });
        try {
          return ok(await A.getOrder(checkoutId));
        } catch (e) {
          if (e instanceof A.ArcadeError && e.status === 404) return ok({ status: "Waiting for payment", pending: true });
          throw e;
        }
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 404 });
    }
  } catch (e) {
    return fail(e);
  }
}
