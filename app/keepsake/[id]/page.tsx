"use client";
import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { chapterById, fmtDate } from "@/lib/chapters";
import { useStore } from "@/lib/store";
import { arcade, pollJob, rid } from "@/lib/client";
import { PatternImage } from "@/components/Art";
import { MadeWithArcade } from "@/components/Brand";

type ProductInfo = {
  productId: string;
  title: string;
  images: { url: string }[];
  unitPrice: { amount: string; currency: string } | null;
  maker?: { name: string };
  selectionLabel?: string;
  demo?: boolean;
};

const money = (p: { amount: string; currency: string }) => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency }).format(Number(p.amount));
  } catch {
    return `${p.amount} ${p.currency}`;
  }
};

export default function KeepsakePage({ params }: { params: { id: string } }) {
  const { state, ready, upsertKeepsake, upsertDesign } = useStore();
  const k = state.keepsakes.find((x) => x.id === params.id);
  const design = k && state.designs.find((d) => d.id === k.designId);
  const memory = k && state.memories.find((m) => m.id === k.memoryId);

  const [elapsed, setElapsed] = useState(0);
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [order, setOrder] = useState<string | null>(null);
  const polling = useRef(false);

  // Resume the product build job (survives refreshes / navigation).
  useEffect(() => {
    if (!k || k.status !== "building" || !k.jobId || polling.current) return;
    polling.current = true;
    setError(null);
    pollJob(k.jobId, setElapsed)
      .then((r) => {
        // Jewelry is built in one job that returns both the design and the product.
        const d = state.designs.find((x) => x.id === k.designId);
        if (r.patternId && d && !d.patternId) upsertDesign({ ...d, status: "approved", patternId: r.patternId });
        upsertKeepsake({ ...k, status: "ready", productId: r.productId });
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Something went wrong");
        upsertKeepsake({ ...k, status: "failed", error: e instanceof Error ? e.message : String(e) });
      })
      .finally(() => (polling.current = false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k, upsertKeepsake]);

  // Always re-read the product (image URLs are short-lived; price must come from Arcade).
  useEffect(() => {
    if (!k?.productId) return;
    arcade<ProductInfo>("product-get", { productId: k.productId })
      .then((p) => {
        setProduct(p);
        if (p.unitPrice && JSON.stringify(p.unitPrice) !== JSON.stringify(k.price)) upsertKeepsake({ ...k, price: p.unitPrice, selectionLabel: p.selectionLabel });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load the product"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k?.productId]);

  useEffect(() => {
    if (!memory) return;
    QRCode.toDataURL(`${window.location.origin}/memory/${memory.id}`, { margin: 1, width: 240, color: { dark: "#1F2A44", light: "#FFFDF9" } })
      .then(setQr)
      .catch(() => {});
  }, [memory]);

  async function buy() {
    if (!k?.productId) return;
    setBuying(true);
    setError(null);
    try {
      // Reuse the requestId on retries so we never create two checkouts for one keepsake.
      const requestId = k.requestId ? `${k.requestId}-co` : rid("co");
      const r = await arcade<{ checkoutId: string; checkoutUrl: string | null; demo?: boolean }>("checkout", { requestId, productId: k.productId });
      upsertKeepsake({ ...k, status: "ordered", checkoutId: r.checkoutId, checkoutUrl: r.checkoutUrl, orderedAt: Date.now() });
      if (r.checkoutUrl) window.open(r.checkoutUrl, "_blank", "noopener");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBuying(false);
    }
  }

  async function checkOrder() {
    if (!k?.checkoutId) return;
    try {
      const o = await arcade<Record<string, any>>("order", { checkoutId: k.checkoutId });
      setOrder(o.pending ? "Waiting for payment to complete on Arcade checkout." : o.demo ? o.status : `Order ${o.orderId || o.name || ""} — ${o.status || o.fulfillmentStatus || o.financialStatus || "placed"}`.trim());
    } catch (e) {
      setOrder(e instanceof Error ? e.message : "Couldn't check the order");
    }
  }

  if (!ready) return <div className="mx-auto max-w-4xl px-4 py-20"><div className="shimmer h-64 rounded-2xl" /></div>;
  if (!k || !memory || !design)
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="font-serif text-3xl text-navy">We couldn&apos;t find that keepsake on this device.</p>
        <Link href="/story" className="btn-primary mt-6">Back to the story</Link>
      </div>
    );

  const ch = chapterById(memory.chapter);
  const img = product?.images?.[0]?.url;
  const price = product?.unitPrice ?? k.price ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href={`/memory/${memory.id}`} className="text-sm text-navy/60 hover:text-navy">← {memory.title}</Link>

      {/* Building */}
      {k.status === "building" && (
        <section className="paper mt-6 flex flex-col items-center p-10 text-center">
          <div className="relative h-48 w-48">
            {design.patternId ? (
              <PatternImage patternId={design.patternId} chapter={memory.chapter} className="h-full w-full rounded-3xl opacity-70" />
            ) : (
              <div className="h-full w-full rounded-3xl bg-gradient-to-br from-cream-deep via-gold-soft to-dusty-soft opacity-80" />
            )}
            <div className="breathe absolute inset-0 rounded-3xl ring-4 ring-gold/50" />
          </div>
          <p className="mt-8 font-serif text-3xl text-navy">Arcade is building your {k.friendlyName.toLowerCase()}</p>
          <p className="mt-2 text-sm text-navy/55">
            {design.kind === "jewelry" ? "Designing the piece, matching a jeweller and pricing it" : "Matching it to a maker and pricing it"} · {elapsed}s
          </p>
        </section>
      )}

      {error && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-coral/40 bg-coral-soft/50 p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-navy">{error}</p>
          {k.status === "failed" && (
            <Link href={design.kind === "jewelry" ? `/fingerprint?memory=${memory.id}` : `/memory/${memory.id}/design`} className="btn-primary">Try again</Link>
          )}
        </div>
      )}

      {(k.status === "ready" || k.status === "ordered") && (
        <section className="mt-6 grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="paper overflow-hidden">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={product?.title || k.friendlyName} className="aspect-square w-full object-cover" />
              ) : !design.patternId ? (
                <div className="flex aspect-square w-full items-center justify-center bg-gradient-to-br from-cream-deep via-gold-soft to-dusty-soft text-sm text-navy/60">
                  {product?.demo ? "Demo placeholder — Arcade shows the real piece here" : "Loading the piece…"}
                </div>
              ) : (
                <div className="relative aspect-square w-full bg-cream-deep p-10">
                  <div className="h-full w-full overflow-hidden rounded-[2.2rem] shadow-[inset_0_0_40px_rgba(31,42,68,0.25),0_20px_40px_-10px_rgba(31,42,68,0.35)]">
                    <PatternImage patternId={design.patternId!} chapter={memory.chapter} className="h-full w-full" />
                  </div>
                </div>
              )}
            </div>
            {product?.images && product.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {product.images.slice(1, 6).map((im, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={im.url} alt="" className="h-20 w-20 rounded-xl object-cover" />
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="eyebrow">Chapter {ch.n} · {ch.name}</p>
            <h1 className="mt-1 font-serif text-4xl text-navy md:text-5xl">{k.friendlyName}</h1>
            <p className="mt-1 text-xs text-navy/50">Arcade · {k.categoryName}{product?.selectionLabel ? ` · ${product.selectionLabel}` : ""}</p>
            <p className="mt-4 font-serif text-xl italic leading-relaxed text-navy/80">{design.story}</p>

            <div className="paper mt-6 p-5">
              {k.status === "ready" ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-navy/60">Price from Arcade</span>
                    <span className="font-serif text-3xl text-navy">
                      {price ? money(price) : product?.demo ? <span className="text-base italic text-navy/60">Demo — live price comes from Arcade</span> : product ? "Pricing…" : "…"}
                    </span>
                  </div>
                  {product?.maker?.name && <p className="mt-1 text-right text-[11px] text-navy/45">Made by {product.maker.name}</p>}
                  <button className="btn-coral mt-4 w-full py-4 text-base" onClick={buy} disabled={buying || !k.productId}>
                    {buying ? "Opening Arcade checkout…" : product?.demo ? "Buy (demo checkout)" : "Buy — secure checkout by Arcade"}
                  </button>
                  <p className="mt-2 text-center text-[11px] text-navy/45">One of one · made on demand · shipped to your home</p>
                </>
              ) : (
                <>
                  <p className="font-serif text-2xl text-navy">♡ It&apos;s joining {state.child.name}&apos;s story.</p>
                  <p className="mt-1 text-sm text-navy/65">
                    Made from: {memory.title} — {k.checkoutUrl ? "finish payment on Arcade's checkout and it ships home." : "demo order, no real purchase made."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {k.checkoutUrl && (
                      <a href={k.checkoutUrl} target="_blank" rel="noopener" className="btn-primary">Open checkout again</a>
                    )}
                    <button className="btn-ghost" onClick={checkOrder}>Check order status</button>
                  </div>
                  {order && <p className="mt-3 text-sm text-navy/70">{order}</p>}
                </>
              )}
            </div>

            {qr && (
              <div className="mt-6 flex items-center gap-4 rounded-2xl border border-navy/10 bg-white/70 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="QR code to the memory page" className="h-24 w-24 rounded-lg" />
                <div>
                  <p className="font-serif text-lg text-navy">Scan to see the full story</p>
                  <p className="text-xs text-navy/55">Printed in the box. Opens “{memory.title}” — {fmtDate(memory.date)}.</p>
                </div>
              </div>
            )}
            <div className="mt-3"><MadeWithArcade category={k.categoryName} /></div>
          </div>
        </section>
      )}
    </div>
  );
}
