"use client";
import Link from "next/link";
import { chapterById, fmtDate } from "@/lib/chapters";
import { useStore } from "@/lib/store";
import { ChapterArt, PatternImage } from "@/components/Art";

export default function MemoryPage({ params }: { params: { id: string } }) {
  const { state, ready } = useStore();
  const m = state.memories.find((x) => x.id === params.id);
  if (!ready) return <div className="mx-auto max-w-3xl px-4 py-20"><div className="shimmer h-64 rounded-2xl" /></div>;
  if (!m)
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="font-serif text-3xl text-navy">This memory isn&apos;t on this device.</p>
        <p className="mt-2 text-navy/60">Memories are private and stored with the family who wrote them.</p>
        <Link href="/story" className="btn-primary mt-6">Back to the story</Link>
      </div>
    );
  const ch = chapterById(m.chapter);
  const made = state.keepsakes.filter((k) => k.memoryId === m.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href={`/story#${m.chapter}`} className="text-sm text-navy/60 hover:text-navy">← {state.child.name}&apos;s story</Link>
      <article className="paper mt-4 overflow-hidden">
        <div className="wash flex items-center gap-5 p-6 md:p-8">
          <ChapterArt id={m.chapter} className="h-20 w-20 shrink-0" />
          <div>
            <p className="eyebrow">Chapter {ch.n} · {ch.name}</p>
            <h1 className="mt-1 font-serif text-4xl text-navy md:text-5xl">{m.title}</h1>
            <p className="mt-1 text-sm text-navy/55">{fmtDate(m.date)}</p>
          </div>
        </div>
        <div className="p-6 md:p-8">
          {m.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.photo} alt="" className="mb-6 max-h-80 w-full rounded-xl object-cover" />
          )}
          <p className="whitespace-pre-line font-serif text-xl leading-relaxed text-navy/85 md:text-2xl">{m.story}</p>
          <p className="mt-6 text-sm italic text-navy/50">— in {state.parents.map((p) => p.name).join(" & ")}&apos;s words</p>
          {m.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {m.tags.map((t) => (
                <span key={t} className="rounded-full bg-cream-deep px-2.5 py-0.5 text-xs text-navy/60">{t.replace("-", " ")}</span>
              ))}
            </div>
          )}
        </div>
      </article>

      {made.length > 0 && (
        <section className="mt-8">
          <h2 className="font-serif text-2xl text-navy">Keepsakes made from this memory</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {made.map((k) => {
              const d = state.designs.find((x) => x.id === k.designId);
              return (
                <Link key={k.id} href={`/keepsake/${k.id}`} className="paper flex items-center gap-3 p-3 transition hover:-translate-y-0.5">
                  {d?.patternId && <PatternImage patternId={d.patternId} chapter={m.chapter} className="h-16 w-16 rounded-xl" />}
                  <div>
                    <p className="font-serif text-lg text-navy">{k.friendlyName}</p>
                    <p className="text-[11px] text-navy/50">{k.categoryName}</p>
                    <p className="text-xs text-coral-deep">{k.status === "ordered" ? "Ordered" : k.status === "ready" ? "Ready to buy" : "In the making"}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-8 flex flex-col items-center gap-3">
        <Link href={`/memory/${m.id}/design`} className="btn-coral px-8 py-4 text-base">
          Turn this memory into a keepsake
        </Link>
        <Link href={`/fingerprint?memory=${m.id}`} className="text-sm text-navy/60 underline hover:text-navy">
          Or make one from {state.child.name}&apos;s fingerprint
        </Link>
      </div>
    </div>
  );
}
