"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { chapterById, friendlyName, shortlistRank } from "@/lib/chapters";
import { useStore, uid } from "@/lib/store";
import { arcade, pollJob, rid } from "@/lib/client";
import { buildPrompt, buildStory, PALETTE_HEX, variationOf } from "@/lib/brief";
import type { Design, Keepsake } from "@/lib/types";
import { PatternImage } from "@/components/Art";
import { MadeWithArcade } from "@/components/Brand";

type Cat = { categoryId: string; name: string; imageUrl: string | null; world: string };
type CatDetail = {
  categoryId: string;
  name: string;
  options: { key: string; label: string; values: { value: string; label: string; isDefault: boolean; available: boolean }[] }[];
  selections: Record<string, string>;
  canManufacture: boolean;
};

const WAIT_LINES = [
  "Arcade is designing — this takes a minute or two.",
  "Reading the memory, choosing the colors…",
  "Softening the edges, the way you remember it…",
  "Making sure it’s one of one…",
];

export default function DesignPageWrapper({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-20"><div className="shimmer h-64 rounded-2xl" /></div>}>
      <DesignPage memoryId={params.id} />
    </Suspense>
  );
}

function DesignPage({ memoryId }: { memoryId: string }) {
  const { state, ready, upsertDesign, upsertKeepsake } = useStore();
  const router = useRouter();
  const search = useSearchParams();
  const memory = state.memories.find((m) => m.id === memoryId);

  const [designId, setDesignId] = useState<string | null>(null);
  const design = state.designs.find((d) => d.id === designId) || null;
  const [prompt, setPrompt] = useState("");
  const [story, setStory] = useState("");
  const [step, setStep] = useState<"brief" | "generating" | "result" | "product" | "building">("brief");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [variations, setVariations] = useState(0);
  const polling = useRef<string | null>(null);

  // Product step state
  const [cats, setCats] = useState<Cat[] | null>(null);
  const [catErr, setCatErr] = useState<string | null>(null);
  const [cat, setCat] = useState<Cat | null>(null);
  const [detail, setDetail] = useState<CatDetail | null>(null);
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [loadingCat, setLoadingCat] = useState(false);

  // Initialise: a queued draft (?design=), the latest design for this memory, or a fresh brief.
  useEffect(() => {
    if (!ready || !memory || designId) return;
    const wanted = search.get("design");
    const existing =
      (wanted && state.designs.find((d) => d.id === wanted)) ||
      [...state.designs].reverse().find((d) => d.memoryId === memory.id && d.status !== "draft" && d.status !== "failed");
    if (existing) {
      setDesignId(existing.id);
      setPrompt(existing.prompt);
      setStory(existing.story);
      if (existing.status === "generating" && existing.jobId) {
        setStep("generating");
        resumePattern(existing);
      } else if (existing.patternId) setStep("result");
      else setStep("brief");
    } else {
      setPrompt(buildPrompt(memory, state.parents));
      setStory(buildStory(memory, state.parents, state.child));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, memory?.id]);

  async function resumePattern(d: Design) {
    if (!d.jobId || polling.current === d.jobId) return;
    polling.current = d.jobId;
    setError(null);
    try {
      const r = await pollJob(d.jobId, setElapsed);
      upsertDesign({ ...d, status: "ready", patternId: r.patternId, error: undefined });
      setStep("result");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      upsertDesign({ ...d, status: "failed", error: msg });
      setError(msg);
      setStep("brief");
    } finally {
      polling.current = null;
    }
  }

  async function generate(p = prompt, reuse?: Design) {
    if (!memory) return;
    setError(null);
    setElapsed(0);
    setStep("generating");
    // Retrying the same failed request reuses its requestId (idempotent); a new design/variation gets a new one.
    const requestId = reuse?.requestId || rid("pattern");
    const base: Design = reuse
      ? { ...reuse, prompt: p, story, status: "generating" }
      : {
          id: design && design.status === "draft" ? design.id : uid("d-"),
          memoryId: memory.id,
          prompt: p,
          story,
          requestId,
          status: "generating",
          source: design?.source || "parent",
          createdAt: Date.now(),
        };
    base.requestId = requestId;
    setDesignId(base.id);
    upsertDesign(base);
    try {
      const job = await arcade<{ jobId: string }>("pattern", { requestId, prompt: p, colors: PALETTE_HEX });
      const withJob = { ...base, jobId: job.jobId };
      upsertDesign(withJob);
      await resumePattern(withJob);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      upsertDesign({ ...base, status: "failed", error: msg });
      setError(msg);
      setStep("brief");
    }
  }

  function variation() {
    const n = variations + 1;
    setVariations(n);
    const p = variationOf(prompt, n);
    setPrompt(p);
    setDesignId(null);
    generate(p);
  }

  // ---- product step ----
  async function loadCategories() {
    setStep("product");
    if (cats) return;
    setCatErr(null);
    try {
      const r = await arcade<{ items: Cat[] }>("categories");
      const sorted = [...r.items].sort((a, b) => shortlistRank(a.name) - shortlistRank(b.name) || a.name.localeCompare(b.name));
      setCats(sorted);
    } catch (e) {
      setCatErr(e instanceof Error ? e.message : "Couldn't load products");
    }
  }

  async function pickCategory(c: Cat, sel: Record<string, string> = {}) {
    setCat(c);
    setLoadingCat(true);
    setCatErr(null);
    try {
      const d = await arcade<CatDetail>("category", { categoryId: c.categoryId, selections: sel });
      setDetail(d);
      setChosen(sel);
    } catch (e) {
      setCatErr(e instanceof Error ? e.message : "Couldn't load options");
    } finally {
      setLoadingCat(false);
    }
  }

  async function makeIt() {
    if (!design?.patternId || !cat || !detail?.canManufacture || !memory) return;
    setStep("building");
    setElapsed(0);
    setError(null);
    upsertDesign({ ...design, status: "approved" });
    const k: Keepsake = {
      id: uid("k-"),
      designId: design.id,
      memoryId: memory.id,
      categoryId: cat.categoryId,
      categoryName: detail.name || cat.name,
      friendlyName: friendlyName(cat.name),
      selections: detail.selections, // the complete returned selection
      requestId: rid("product"),
      status: "building",
      createdAt: Date.now(),
    };
    upsertKeepsake(k);
    try {
      const job = await arcade<{ jobId: string }>("product", {
        requestId: k.requestId,
        patternId: design.patternId,
        categoryId: cat.categoryId,
        selections: detail.selections,
      });
      upsertKeepsake({ ...k, jobId: job.jobId });
      router.push(`/keepsake/${k.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      upsertKeepsake({ ...k, status: "failed", error: msg });
      setError(msg);
      setStep("product");
    }
  }

  if (!ready) return <div className="mx-auto max-w-4xl px-4 py-20"><div className="shimmer h-64 rounded-2xl" /></div>;
  if (!memory)
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="font-serif text-3xl text-navy">We couldn&apos;t find that memory.</p>
        <Link href="/story" className="btn-primary mt-6">Back to the story</Link>
      </div>
    );
  const ch = chapterById(memory.chapter);
  const stepIdx = { brief: 0, generating: 1, result: 1, product: 2, building: 3 }[step];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href={`/memory/${memory.id}`} className="text-sm text-navy/60 hover:text-navy">← {memory.title}</Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Chapter {ch.n} · Turn this memory into a keepsake</p>
          <h1 className="mt-1 font-serif text-4xl text-navy md:text-5xl">{memory.title}</h1>
        </div>
        <ol className="flex gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em]">
          {["Brief", "Design", "Product", "Make"].map((s, i) => (
            <li key={s} className={`rounded-full px-3 py-1 ${i <= stepIdx ? "bg-navy text-cream" : "bg-cream-deep text-navy/50"}`}>{s}</li>
          ))}
        </ol>
      </div>

      {error && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-coral/40 bg-coral-soft/50 p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-navy">{error}</p>
          {step === "brief" && design?.status === "failed" && (
            <button className="btn-primary" onClick={() => generate(prompt, design)}>Try again</button>
          )}
        </div>
      )}

      {/* STEP 1 — Brief */}
      {step === "brief" && (
        <section className="mt-8 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div className="paper p-6">
            <p className="label">The design brief Finite wrote from this memory</p>
            <textarea className="input min-h-[220px] font-mono text-[13px] leading-relaxed" value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={1000} />
            <p className="mt-2 text-xs text-navy/50">
              Built from the chapter mood, the details in your story, and who you are as parents. Edit anything — it goes to Arcade exactly as written.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="btn-coral" onClick={() => generate()} disabled={!prompt.trim()}>
                Generate design
              </button>
              <button
                className="btn-ghost"
                onClick={() => {
                  setPrompt(buildPrompt(memory, state.parents));
                  setStory(buildStory(memory, state.parents, state.child));
                }}
              >
                Rewrite from memory
              </button>
            </div>
          </div>
          <StoryCard story={story} setStory={setStory} />
        </section>
      )}

      {/* STEP 2 — Generating */}
      {step === "generating" && (
        <section className="mt-8 grid gap-6 md:grid-cols-[1fr_1fr]">
          <div className="paper flex aspect-square flex-col items-center justify-center p-8 text-center">
            <div className="breathe h-28 w-28 rounded-full bg-gradient-to-br from-coral-soft via-gold-soft to-dusty-soft" />
            <p className="mt-8 font-serif text-2xl text-navy">{WAIT_LINES[Math.floor(elapsed / 15) % WAIT_LINES.length]}</p>
            <p className="mt-2 text-sm text-navy/50">{elapsed > 0 ? `${elapsed}s` : "Starting…"} · you can leave this page — we&apos;ll keep your place</p>
          </div>
          <div className="paper p-6">
            <p className="label">What Arcade is working from</p>
            <p className="font-mono text-[13px] leading-relaxed text-navy/75">{prompt}</p>
            <div className="mt-6 border-t border-navy/10 pt-4">
              <p className="label">The story behind it</p>
              <p className="font-serif text-lg italic leading-relaxed text-navy/80">{story}</p>
            </div>
          </div>
        </section>
      )}

      {/* STEP 3 — Result */}
      {step === "result" && design?.patternId && (
        <section className="mt-8 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <PatternImage patternId={design.patternId} chapter={memory.chapter} className="aspect-square w-full rounded-[1.5rem] shadow-soft" />
            <div className="mt-2"><MadeWithArcade /></div>
          </div>
          <div className="flex flex-col gap-4">
            <StoryCard story={story} setStory={(s) => { setStory(s); upsertDesign({ ...design, story: s }); }} />
            <div className="paper space-y-2 p-5">
              <button className="btn-coral w-full" onClick={loadCategories}>Love it — put it on a product</button>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-ghost" onClick={variation}>Try a variation</button>
                <button
                  className="btn-ghost"
                  onClick={() => {
                    setDesignId(null);
                    setStep("brief");
                  }}
                >
                  Edit the brief
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STEP 4 — Product */}
      {(step === "product" || step === "building") && design?.patternId && (
        <section className="mt-8 grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <PatternImage patternId={design.patternId} chapter={memory.chapter} className="aspect-square w-full rounded-[1.5rem] shadow-soft" />
            <button className="mt-3 text-sm text-navy/60 hover:text-navy" onClick={() => setStep("result")}>← Back to the design</button>
          </div>
          <div className="paper p-6">
            <h2 className="font-serif text-3xl text-navy">Choose the keepsake</h2>
            <p className="mt-1 text-sm text-navy/60">Live from Arcade&apos;s catalog — only what can actually be made today.</p>

            {catErr && <p className="mt-4 rounded-xl bg-coral-soft/60 p-3 text-sm text-navy">{catErr} <button className="underline" onClick={() => { setCats(null); loadCategories(); }}>Retry</button></p>}
            {!cats && !catErr && <div className="mt-4 grid grid-cols-2 gap-2">{[0, 1, 2, 3].map((i) => <div key={i} className="shimmer h-20 rounded-xl" />)}</div>}

            {cats && (
              <div className="mt-4 grid max-h-[300px] grid-cols-2 gap-2 overflow-y-auto pr-1">
                {cats.map((c) => (
                  <button
                    key={c.categoryId}
                    onClick={() => pickCategory(c)}
                    className={`rounded-xl border p-3 text-left transition ${cat?.categoryId === c.categoryId ? "border-navy bg-navy text-cream" : "border-navy/10 bg-white hover:border-navy/40"}`}
                  >
                    <p className="font-serif text-lg leading-tight">{friendlyName(c.name)}</p>
                    <p className={`mt-0.5 text-[11px] ${cat?.categoryId === c.categoryId ? "text-cream/60" : "text-navy/45"}`}>Arcade · {c.name}</p>
                  </button>
                ))}
                {cats.length === 0 && <p className="col-span-2 text-sm text-navy/60">Arcade didn&apos;t return any print categories for this account.</p>}
              </div>
            )}

            {cat && (
              <div className="mt-6 border-t border-navy/10 pt-5">
                {loadingCat && !detail && <div className="shimmer h-24 rounded-xl" />}
                {detail && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {detail.options.map((o) => (
                        <div key={o.key}>
                          <label className="label">{o.label}</label>
                          <select
                            className="input"
                            disabled={loadingCat}
                            value={detail.selections[o.key] || ""}
                            onChange={(e) => pickCategory(cat, { ...chosen, [o.key]: e.target.value })}
                          >
                            {o.values
                              .filter((v) => v.available || v.value === detail.selections[o.key])
                              .map((v) => (
                                <option key={v.value} value={v.value}>{v.label}</option>
                              ))}
                          </select>
                        </div>
                      ))}
                    </div>
                    {!detail.canManufacture && <p className="mt-3 text-sm text-coral-deep">That combination can&apos;t be made — change one of the options above.</p>}
                    <button className="btn-primary mt-5 w-full py-4 text-base" disabled={!detail.canManufacture || loadingCat || step === "building"} onClick={makeIt}>
                      {step === "building" ? "Sending to Arcade…" : `Make it — ${friendlyName(cat.name).toLowerCase()}`}
                    </button>
                    <p className="mt-2 text-center text-[11px] text-navy/45">Next you&apos;ll see the finished product and Arcade&apos;s price before you buy anything.</p>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function StoryCard({ story, setStory }: { story: string; setStory: (s: string) => void }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="paper bg-[#FFFBF4] p-6">
      <p className="label">The story behind this keepsake</p>
      {editing ? (
        <textarea className="input min-h-[140px] font-serif text-lg" value={story} onChange={(e) => setStory(e.target.value)} onBlur={() => setEditing(false)} autoFocus />
      ) : (
        <p className="font-serif text-xl italic leading-relaxed text-navy/85" onClick={() => setEditing(true)}>{story}</p>
      )}
      <p className="mt-3 text-[11px] text-navy/45">Printed on the card in the box and on the memory page behind the QR code. Tap to edit.</p>
    </div>
  );
}
