"use client";
import Link from "next/link";
import { useState } from "react";
import { CHAPTERS, ageLabel, chapterById, currentChapter, fmtDate, type ChapterId } from "@/lib/chapters";
import { useStore } from "@/lib/store";
import { ChapterArt, PatternImage } from "@/components/Art";
import { AddMemory } from "@/components/AddMemory";

export default function StoryPage() {
  const { state, ready, resetDemo, set } = useStore();
  const [adding, setAdding] = useState<ChapterId | null>(null);
  const [editingParents, setEditingParents] = useState(false);
  const { child, parents, memories, keepsakes, designs, subscription } = state;
  const cur = currentChapter(child.birthDate, child.dueDate);
  const queued = designs.filter((d) => d.source === "subscription" && d.status === "draft");

  if (!ready) return <div className="mx-auto max-w-4xl px-4 py-20"><div className="shimmer h-40 rounded-2xl" /></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Child header */}
      <section className="wash paper flex flex-col gap-6 p-6 md:flex-row md:items-center md:p-8">
        <ChapterArt id={cur} className="h-28 w-28 shrink-0" />
        <div className="flex-1">
          <p className="eyebrow">{ageLabel(child.birthDate, child.dueDate)} · now in Chapter {chapterById(cur).n}</p>
          <h1 className="mt-1 font-serif text-5xl text-navy">{child.name}&apos;s story</h1>
          <p className="mt-1 font-serif text-xl italic text-navy/60">{chapterById(cur).tagline}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => setAdding(cur)}>
              + Add a memory
            </button>
            <button className="btn-ghost" onClick={() => setEditingParents((v) => !v)}>
              {editingParents ? "Done" : "About us"}
            </button>
          </div>
        </div>
      </section>

      {/* Parent personas — feed the design engine */}
      {editingParents && (
        <section className="paper mt-4 grid gap-4 p-6 md:grid-cols-2">
          {parents.map((p, i) => (
            <div key={i} className="space-y-2">
              <p className="eyebrow">{p.role === "mom" ? "Mom" : p.role === "dad" ? "Dad" : "Parent"}</p>
              <input
                className="input"
                value={p.name}
                onChange={(e) => set((s) => ({ ...s, parents: s.parents.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) }))}
              />
              <label className="label">In a few words, what you&apos;re like</label>
              <textarea
                className="input min-h-[64px]"
                value={p.about}
                onChange={(e) => set((s) => ({ ...s, parents: s.parents.map((x, j) => (j === i ? { ...x, about: e.target.value } : x)) }))}
              />
              <label className="label">One hope for {child.name}</label>
              <textarea
                className="input min-h-[64px]"
                value={p.hope}
                onChange={(e) => set((s) => ({ ...s, parents: s.parents.map((x, j) => (j === i ? { ...x, hope: e.target.value } : x)) }))}
              />
            </div>
          ))}
          <p className="text-xs text-navy/50 md:col-span-2">Finite weaves who you are into every design brief and keepsake story.</p>
        </section>
      )}

      {/* Chapter-trigger: queued subscription keepsake */}
      {queued.map((d) => {
        const m = memories.find((x) => x.id === d.memoryId);
        if (!m) return null;
        const member = subscription.plan !== "digital" && subscription.status === "active";
        return (
          <section key={d.id} className="mt-4 flex flex-col gap-3 rounded-2xl border border-gold/50 bg-gold-soft/40 p-5 sm:flex-row sm:items-center">
            <span className="breathe text-2xl">✦</span>
            <div className="flex-1">
              <p className="font-serif text-xl text-navy">
                {member ? "Your next chapter keepsake is ready to review" : "A new milestone — this could be your next keepsake"}
              </p>
              <p className="text-sm text-navy/65">
                Drafted from “{m.title}”. {member ? "Nothing is made until you approve it." : "Finite Chapters members get this designed automatically."}
              </p>
            </div>
            <Link href={`/memory/${m.id}/design?design=${d.id}`} className="btn-primary">
              Review draft
            </Link>
          </section>
        );
      })}

      {/* Timeline */}
      <ol className="relative mt-10 space-y-12 before:absolute before:left-5 before:top-2 before:h-full before:w-px before:bg-gradient-to-b before:from-dusty before:via-gold before:to-navy/30">
        {CHAPTERS.map((c) => {
          const mems = memories.filter((m) => m.chapter === c.id).sort((a, b) => a.date.localeCompare(b.date));
          const isCur = c.id === cur;
          return (
            <li key={c.id} id={c.id} className="relative scroll-mt-24 pl-14">
              <span
                className={`absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full border font-serif text-lg ${
                  isCur ? "border-coral-deep bg-coral-deep text-cream" : "border-navy/15 bg-cream text-navy/60"
                }`}
              >
                {c.n}
              </span>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h2 className="font-serif text-3xl text-navy">{c.name}</h2>
                <span className="font-serif text-lg italic text-coral-deep">{c.tagline}</span>
                {isCur && <span className="rounded-full bg-coral-soft px-2.5 py-0.5 text-[11px] font-medium text-coral-deep">Current chapter</span>}
              </div>

              <div className="mt-4 space-y-4">
                {mems.map((m) => {
                  const made = keepsakes.filter((k) => k.memoryId === m.id);
                  return (
                    <article key={m.id} className="paper overflow-hidden">
                      <Link href={`/memory/${m.id}`} className="block p-5 transition hover:bg-white">
                        <div className="flex gap-4">
                          {m.photo && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.photo} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.14em] text-navy/45">{fmtDate(m.date)}</p>
                            <h3 className="mt-0.5 font-serif text-2xl text-navy">{m.title}</h3>
                            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-navy/70">{m.story}</p>
                          </div>
                        </div>
                      </Link>
                      <div className="flex flex-wrap items-center gap-3 border-t border-navy/5 bg-cream/60 px-5 py-3">
                        {made.map((k) => {
                          const d = designs.find((x) => x.id === k.designId);
                          return (
                            <Link key={k.id} href={`/keepsake/${k.id}`} className="flex items-center gap-2 rounded-full bg-white px-2 py-1 pr-3 text-xs text-navy shadow-sm">
                              {d?.patternId && <PatternImage patternId={d.patternId} chapter={m.chapter} className="h-6 w-6 rounded-full" />}
                              {k.friendlyName} · {k.status === "ordered" ? "ordered" : k.status === "ready" ? "ready to buy" : "in the making"}
                            </Link>
                          );
                        })}
                        <Link href={`/memory/${m.id}/design`} className="ml-auto text-sm font-medium text-coral-deep hover:underline">
                          Turn this memory into a keepsake →
                        </Link>
                      </div>
                    </article>
                  );
                })}

                {mems.length === 0 && (
                  <button
                    onClick={() => setAdding(c.id)}
                    className="w-full rounded-2xl border border-dashed border-navy/20 p-5 text-left transition hover:border-coral hover:bg-white/60"
                  >
                    <p className="font-serif text-xl italic text-navy/70">“{c.suggestion}”</p>
                    <p className="mt-1 text-sm text-coral-deep">+ Add the first memory to this chapter</p>
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="no-print mt-16 text-center">
        <button
          className="text-xs text-navy/40 underline hover:text-navy/70"
          onClick={() => {
            if (confirm("Reset to the Siya demo family? This clears local designs and orders.")) resetDemo();
          }}
        >
          Reset demo family
        </button>
      </div>

      {adding && <AddMemory defaultChapter={adding} onClose={() => setAdding(null)} />}
    </div>
  );
}
