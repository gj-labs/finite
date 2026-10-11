"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { fmtDate } from "@/lib/chapters";
import { useStore, uid } from "@/lib/store";
import { arcade, rid } from "@/lib/client";
import { PALETTE_HEX } from "@/lib/brief";
import type { Design, Keepsake } from "@/lib/types";
import { MadeWithArcade } from "@/components/Brand";

type Cat = { categoryId: string; name: string };
type CatDetail = {
  name: string;
  options: { key: string; label: string; values: { value: string; label: string; isDefault: boolean; available: boolean }[] }[];
  selections: Record<string, string>;
};

const SHAPES = ["heart", "round disc", "teardrop"];

const pendantPrompt = (shape: string, material: string, initial: string) =>
  `A dainty ${shape} pendant necklace in ${material}, engraved with a baby's fingerprint swirl` +
  (initial ? ` and a small letter ${initial}` : "") +
  ". Delicate, minimal, heirloom feel.";

const printPrompt = (name: string) =>
  `A soft, cozy nursery pattern built around this baby's fingerprint — keep the fingerprint ridges clearly recognisable, like a gentle ink stamp, ` +
  `repeated across the design with tiny hearts and a small handwritten "${name}". Warm cream background with muted navy, sage, dusty blue and soft coral.`;

const fingerprintStory = (name: string, date: string) =>
  `${name}'s fingerprint, from ${fmtDate(date)}. The smallest whorl of who she is — kept for the day her hand is too big to fit in ours.`;

// Downscale in the browser so the upload stays small (Arcade allows up to 10 MB).
function toDataUrl(file: File, max = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that photo."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file doesn't look like a photo."));
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.9));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function FingerprintPageWrapper() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-20"><div className="shimmer h-64 rounded-2xl" /></div>}>
      <FingerprintPage />
    </Suspense>
  );
}

function FingerprintPage() {
  const { state, ready, upsertDesign, upsertKeepsake } = useStore();
  const router = useRouter();
  const search = useSearchParams();
  const name = state.child.name;

  const [memoryId, setMemoryId] = useState<string>("");
  useEffect(() => {
    if (!ready || memoryId) return;
    const wanted = search.get("memory");
    const m = state.memories.find((x) => x.id === wanted) || state.memories.find((x) => x.id === "m-birth") || state.memories[0];
    if (m) setMemoryId(m.id);
  }, [ready, memoryId, search, state.memories]);
  const memory = state.memories.find((m) => m.id === memoryId);

  // ---- Pendant (jewelry: designed from words) ----
  const [pendantCat, setPendantCat] = useState<Cat | null>(null);
  const [detail, setDetail] = useState<CatDetail | null>(null);
  const [material, setMaterial] = useState("");
  const [shape, setShape] = useState(SHAPES[0]);
  const [initial, setInitial] = useState("");
  const [pPrompt, setPPrompt] = useState("");
  const [pEdited, setPEdited] = useState(false);
  const [pBusy, setPBusy] = useState(false);
  const [pErr, setPErr] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !initial) setInitial(name.charAt(0).toUpperCase());
  }, [ready, name, initial]);

  useEffect(() => {
    if (!ready) return;
    arcade<{ items: Cat[] }>("jewelry-categories")
      .then(async (r) => {
        const c = r.items.find((x) => /pendant|necklace/i.test(x.name));
        if (!c) return setPErr("Arcade isn't offering a pendant necklace on this account right now.");
        setPendantCat(c);
        const d = await arcade<CatDetail>("category", { categoryId: c.categoryId, selections: {} });
        setDetail(d);
        setMaterial(d.selections.material || d.options[0]?.values.find((v) => v.available)?.value || "");
      })
      .catch((e) => setPErr(e instanceof Error ? e.message : "Couldn't load Arcade's jewelry"));
  }, [ready]);

  useEffect(() => {
    if (!pEdited && material) setPPrompt(pendantPrompt(shape, material, initial.trim().slice(0, 2)));
  }, [shape, material, initial, pEdited]);

  const materials = useMemo(() => detail?.options.find((o) => o.key === "material")?.values.filter((v) => v.available) || [], [detail]);

  async function makePendant() {
    if (!memory || !pendantCat || !pPrompt.trim()) return;
    setPBusy(true);
    setPErr(null);
    const d: Design = {
      id: uid("d-"),
      memoryId: memory.id,
      prompt: pPrompt,
      story: fingerprintStory(name, memory.date),
      requestId: rid("jewelry"),
      status: "generating",
      source: "parent",
      kind: "jewelry",
      createdAt: Date.now(),
    };
    try {
      const job = await arcade<{ jobId: string }>("jewelry", { requestId: d.requestId, categoryId: pendantCat.categoryId, prompt: pPrompt });
      const k: Keepsake = {
        id: uid("k-"),
        designId: d.id,
        memoryId: memory.id,
        categoryId: pendantCat.categoryId,
        categoryName: detail?.name || pendantCat.name,
        friendlyName: "Fingerprint pendant",
        selections: material ? { material } : {},
        requestId: d.requestId!,
        jobId: job.jobId,
        status: "building",
        createdAt: Date.now(),
      };
      upsertDesign({ ...d, jobId: job.jobId });
      upsertKeepsake(k);
      router.push(`/keepsake/${k.id}`);
    } catch (e) {
      setPErr(e instanceof Error ? e.message : "Something went wrong");
      setPBusy(false);
    }
  }

  // ---- Real fingerprint on a print keepsake (reference photo) ----
  const [photo, setPhoto] = useState<string | null>(null);
  const [fPrompt, setFPrompt] = useState("");
  const [fBusy, setFBusy] = useState<string | null>(null);
  const [fErr, setFErr] = useState<string | null>(null);
  useEffect(() => {
    if (ready && !fPrompt) setFPrompt(printPrompt(name));
  }, [ready, name, fPrompt]);

  async function onPhoto(f?: File) {
    if (!f) return;
    setFErr(null);
    try {
      setPhoto(await toDataUrl(f));
    } catch (e) {
      setFErr(e instanceof Error ? e.message : "Couldn't read that photo.");
    }
  }

  async function designWithFingerprint() {
    if (!memory || !photo || !fPrompt.trim()) return;
    setFErr(null);
    try {
      setFBusy("Uploading her fingerprint to Arcade…");
      const ref = await arcade<{ referenceId: string }>("reference", { requestId: rid("ref"), dataUrl: photo });
      setFBusy("Starting the design…");
      const d: Design = {
        id: uid("d-"),
        memoryId: memory.id,
        prompt: fPrompt,
        story: fingerprintStory(name, memory.date),
        requestId: rid("pattern"),
        status: "generating",
        source: "parent",
        kind: "print",
        referenceIds: [ref.referenceId],
        createdAt: Date.now(),
      };
      const job = await arcade<{ jobId: string }>("pattern", { requestId: d.requestId, prompt: fPrompt, colors: PALETTE_HEX, referenceIds: d.referenceIds });
      upsertDesign({ ...d, jobId: job.jobId });
      // The design page resumes the job, then continues to the normal product → make → buy flow.
      router.push(`/memory/${memory.id}/design?design=${d.id}`);
    } catch (e) {
      setFErr(e instanceof Error ? e.message : "Something went wrong");
      setFBusy(null);
    }
  }

  if (!ready) return <div className="mx-auto max-w-4xl px-4 py-20"><div className="shimmer h-64 rounded-2xl" /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="eyebrow">{name}&apos;s fingerprint</p>
      <h1 className="mt-1 font-serif text-4xl text-navy md:text-5xl">The smallest part of her story</h1>
      <p className="mt-3 max-w-2xl text-navy/65">
        Turn {name}&apos;s fingerprint into something you can hold — a pendant to wear, or her real print on a keepsake for the nursery.
      </p>

      <div className="mt-6 max-w-sm">
        <label className="label">Attach it to the memory</label>
        <select className="input" value={memoryId} onChange={(e) => setMemoryId(e.target.value)}>
          {state.memories.map((m) => (
            <option key={m.id} value={m.id}>{m.title} · {fmtDate(m.date)}</option>
          ))}
        </select>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Pendant */}
        <section className="paper flex flex-col p-6">
          <p className="eyebrow">To wear</p>
          <h2 className="mt-1 font-serif text-3xl text-navy">Fingerprint pendant</h2>
          <p className="mt-2 text-sm text-navy/60">
            Arcade&apos;s jewellers make it in real metal. Jewelry is designed from words, so the swirl is Arcade&apos;s engraving of a baby&apos;s fingerprint — for {name}&apos;s actual print, use the fingerprint keepsake.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Shape</label>
              <select className="input" value={shape} onChange={(e) => setShape(e.target.value)}>
                {SHAPES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Initial</label>
              <input className="input" value={initial} maxLength={2} onChange={(e) => setInitial(e.target.value.toUpperCase())} placeholder="S" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Metal</label>
              {materials.length ? (
                <select className="input" value={material} onChange={(e) => setMaterial(e.target.value)}>
                  {materials.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
              ) : (
                !pErr && <div className="shimmer h-11 rounded-xl" />
              )}
            </div>
          </div>

          <label className="label mt-4">What Arcade will make</label>
          <textarea className="input min-h-[96px] text-[13px]" value={pPrompt} maxLength={600} onChange={(e) => { setPPrompt(e.target.value); setPEdited(true); }} />
          {pEdited && (
            <button className="mt-1 self-start text-xs text-navy/50 underline" onClick={() => setPEdited(false)}>Reset to the options above</button>
          )}

          {pErr && <p className="mt-3 rounded-xl bg-coral-soft/60 p-3 text-sm text-navy">{pErr}</p>}
          <div className="mt-auto pt-5">
            <button className="btn-coral w-full py-4 text-base" disabled={pBusy || !pendantCat || !material || !pPrompt.trim() || !memory} onClick={makePendant}>
              {pBusy ? "Sending to Arcade…" : "Design the pendant"}
            </button>
            <p className="mt-2 text-center text-[11px] text-navy/45">About a minute. You&apos;ll see the piece and Arcade&apos;s price before you buy.</p>
          </div>
        </section>

        {/* Real fingerprint on a print keepsake */}
        <section className="paper flex flex-col p-6">
          <p className="eyebrow">Her real print</p>
          <h2 className="mt-1 font-serif text-3xl text-navy">Fingerprint keepsake</h2>
          <p className="mt-2 text-sm text-navy/60">
            Upload a photo of {name}&apos;s fingerprint — an ink print on white paper works best. Arcade designs around it, then you pick the product: a nursery pillow, quilt, tea towel…
          </p>

          <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-navy/15 bg-white/60 p-4 text-center transition hover:border-gold">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt={`${name}'s fingerprint`} className="h-40 rounded-xl object-contain" />
            ) : (
              <span className="py-10 text-sm text-navy/55">Tap to choose a fingerprint photo</span>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
          </label>
          {photo && <button className="mt-1 self-start text-xs text-navy/50 underline" onClick={() => setPhoto(null)}>Choose a different photo</button>}

          <label className="label mt-4">The design brief</label>
          <textarea className="input min-h-[96px] text-[13px]" value={fPrompt} maxLength={1000} onChange={(e) => setFPrompt(e.target.value)} />

          {fErr && <p className="mt-3 rounded-xl bg-coral-soft/60 p-3 text-sm text-navy">{fErr}</p>}
          <div className="mt-auto pt-5">
            <button className="btn-primary w-full py-4 text-base" disabled={!!fBusy || !photo || !fPrompt.trim() || !memory} onClick={designWithFingerprint}>
              {fBusy || "Design with her fingerprint"}
            </button>
            <p className="mt-2 text-center text-[11px] text-navy/45">The photo goes to Arcade only when you tap this button.</p>
          </div>
        </section>
      </div>

      <div className="mt-6 flex items-center justify-between">
        {memory && <Link href={`/memory/${memory.id}`} className="text-sm text-navy/60 hover:text-navy">← {memory.title}</Link>}
        <MadeWithArcade />
      </div>
    </div>
  );
}
