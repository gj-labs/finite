"use client";
import Link from "next/link";
import { useState } from "react";
import { CHAPTERS, chapterById, currentChapter, type ChapterId } from "@/lib/chapters";
import { useStore, uid } from "@/lib/store";
import type { Plan } from "@/lib/types";

const TIERS: { id: Plan; name: string; price: string; tag: string; perks: string[] }[] = [
  {
    id: "digital",
    name: "Digital",
    price: "Free",
    tag: "The growing archive",
    perks: ["Memory pages for every chapter", "The full archive, always yours", "Milestone reminders", "One-off keepsakes any time"],
  },
  {
    id: "chapters",
    name: "Chapters",
    price: "$19",
    tag: "A keepsake per milestone",
    perks: [
      "One personalized Arcade keepsake per chapter milestone — designed from your newest memory",
      "You approve every design before anything is made",
      "Member pricing on extra one-offs",
      "Free design revisions",
      "Printed chapter page in every box",
    ],
  },
  {
    id: "heirloom",
    name: "Chapters Heirloom",
    price: "$39",
    tag: "For the long story",
    perks: [
      "Everything in Chapters",
      "One premium piece a year (ceramic, rug — whatever Arcade can make live)",
      "Annual printed archive book",
      "Gift credits for grandparents",
    ],
  },
];

export default function ChaptersPage() {
  const { state, ready, set } = useStore();
  const [picking, setPicking] = useState<Plan | null>(null);
  const [gift, setGift] = useState({ to: "", from: "", message: "", plan: "chapters" as Plan, startChapter: "newborn" as ChapterId });
  const [giftSent, setGiftSent] = useState(false);
  const sub = state.subscription;
  const member = sub.plan !== "digital";
  const cur = currentChapter(state.child.birthDate);
  const queued = state.designs.filter((d) => d.source === "subscription" && d.status === "draft");
  const orders = state.keepsakes.filter((k) => k.status === "ordered");

  if (!ready) return <div className="mx-auto max-w-5xl px-4 py-20"><div className="shimmer h-64 rounded-2xl" /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <p className="eyebrow text-center">Finite Chapters</p>
      <h1 className="mt-3 text-center font-serif text-5xl text-navy">A keepsake when life happens</h1>
      <p className="mx-auto mt-4 max-w-2xl text-center text-navy/70">
        Not a monthly box. When you log a first, a birthday or a new chapter, Finite drafts the next keepsake from it — and
        nothing is made until you say yes.
      </p>

      {/* Member dashboard */}
      {member && (
        <section className="mt-10 rounded-[1.5rem] bg-navy p-6 text-cream md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Your plan</p>
              <p className="mt-1 font-serif text-3xl">
                {TIERS.find((t) => t.id === sub.plan)?.name} · <span className="italic">{sub.status}</span>
              </p>
              <p className="mt-1 text-sm text-cream/60">Demo billing — no card was charged.</p>
            </div>
            <div className="flex gap-2">
              {sub.status === "active" ? (
                <button className="btn border border-cream/30 text-cream hover:bg-white/10" onClick={() => set((s) => ({ ...s, subscription: { ...s.subscription, status: "paused" } }))}>
                  Pause
                </button>
              ) : (
                <button className="btn bg-gold text-navy" onClick={() => set((s) => ({ ...s, subscription: { ...s.subscription, status: "active" } }))}>
                  Resume
                </button>
              )}
              <button
                className="btn border border-cream/30 text-cream hover:bg-white/10"
                onClick={() => {
                  if (confirm("Cancel Finite Chapters? Your archive and memories stay with you, free, forever.")) {
                    set((s) => ({ ...s, subscription: { plan: "digital", status: "active", since: Date.now() } }));
                  }
                }}
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.16em] text-cream/50">Chapter progress</p>
            <div className="mt-2 flex gap-1">
              {CHAPTERS.map((c) => (
                <div key={c.id} className={`h-2 flex-1 rounded-full ${c.n <= chapterById(cur).n ? "bg-gold" : "bg-white/15"}`} title={c.name} />
              ))}
            </div>
            <p className="mt-2 text-sm text-cream/70">{state.child.name} is in Chapter {chapterById(cur).n}: {chapterById(cur).name}</p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cream/50">Next queued keepsake</p>
              {queued.length ? (
                queued.map((d) => {
                  const m = state.memories.find((x) => x.id === d.memoryId);
                  return (
                    <div key={d.id} className="mt-2 flex items-center justify-between gap-2">
                      <p className="font-serif text-xl">From “{m?.title}”</p>
                      <Link href={`/memory/${d.memoryId}/design?design=${d.id}`} className="btn bg-gold px-4 py-2 text-navy">Review</Link>
                    </div>
                  );
                })
              ) : (
                <p className="mt-2 text-sm text-cream/70">
                  Nothing waiting. Tag your next memory as a first, birthday or milestone and the draft appears here.
                </p>
              )}
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cream/50">Order history</p>
              {orders.length ? (
                <ul className="mt-2 space-y-1 text-sm">
                  {orders.map((k) => (
                    <li key={k.id}>
                      <Link href={`/keepsake/${k.id}`} className="hover:underline">
                        {k.friendlyName} — from “{state.memories.find((m) => m.id === k.memoryId)?.title}”
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-cream/70">No keepsakes ordered yet.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Tiers */}
      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {TIERS.map((t) => {
          const isCurrent = sub.plan === t.id;
          return (
            <div key={t.id} className={`paper flex flex-col p-6 ${t.id === "chapters" ? "ring-2 ring-gold" : ""}`}>
              {t.id === "chapters" && <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Most families</p>}
              <h2 className="font-serif text-3xl text-navy">{t.name}</h2>
              <p className="font-serif text-lg italic text-navy/60">{t.tag}</p>
              <p className="mt-4 font-serif text-3xl text-navy">{t.price}{t.id !== "digital" && <span className="text-sm text-navy/50"> / month</span>}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-navy/75">
                {t.perks.map((p) => (
                  <li key={p} className="flex gap-2"><span className="text-coral-deep">♡</span>{p}</li>
                ))}
              </ul>
              <button
                className={`mt-6 ${isCurrent ? "btn-ghost" : t.id === "digital" ? "btn-ghost" : "btn-primary"}`}
                disabled={isCurrent}
                onClick={() => setPicking(t.id)}
              >
                {isCurrent ? "Your plan" : t.id === "digital" ? "Switch to free" : `Choose ${t.name}`}
              </button>
            </div>
          );
        })}
      </section>
      <p className="mt-4 text-center text-xs text-navy/50">Pause or cancel in one tap, any time. No dark patterns — your archive is always yours, even on the free plan.</p>

      {/* Confirm */}
      {picking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/30 p-4 backdrop-blur-sm" onClick={() => setPicking(null)}>
          <div className="paper w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow">Confirm</p>
            <h3 className="mt-1 font-serif text-3xl text-navy">{TIERS.find((t) => t.id === picking)?.name}</h3>
            <p className="mt-2 text-sm text-navy/70">
              {picking === "digital"
                ? "You'll keep every memory and the full archive. Queued keepsakes stop."
                : `Your next keepsake will be drafted from ${state.child.name}'s next milestone. You approve every design before anything is made.`}
            </p>
            <p className="mt-3 rounded-xl bg-gold-soft/50 p-3 text-xs text-navy/70">Demo billing for the hackathon — no payment is taken.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setPicking(null)}>Not now</button>
              <button
                className="btn-primary"
                onClick={() => {
                  set((s) => ({ ...s, subscription: { plan: picking, status: "active", since: Date.now() } }));
                  setPicking(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gift */}
      <section id="gift" className="mt-16 scroll-mt-24 grid gap-6 rounded-[1.5rem] bg-cream-deep/70 p-6 md:grid-cols-2 md:p-10">
        <div>
          <p className="eyebrow">For grandparents</p>
          <h2 className="mt-2 font-serif text-4xl text-navy">Gift Finite Chapters</h2>
          <p className="mt-3 text-navy/70">
            The family keeps the memories; you help turn them into things they can hold. Parents approve everything — you just
            get to be part of the story.
          </p>
          {state.gifts.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-navy/70">
              {state.gifts.map((g) => (
                <li key={g.id}>♡ Gift to {g.to} from {g.from || "you"} · starts in {chapterById(g.startChapter).name}</li>
              ))}
            </ul>
          )}
        </div>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!gift.to) return;
            set((s) => ({ ...s, gifts: [...s.gifts, { ...gift, id: uid("g-"), createdAt: Date.now() }] }));
            setGiftSent(true);
            setGift({ ...gift, to: "", message: "" });
          }}
        >
          <div>
            <label className="label">Their email</label>
            <input className="input" type="email" required value={gift.to} onChange={(e) => setGift({ ...gift, to: e.target.value })} placeholder="new.parents@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">From</label>
              <input className="input" value={gift.from} onChange={(e) => setGift({ ...gift, from: e.target.value })} placeholder="Nani & Nana" />
            </div>
            <div>
              <label className="label">Start chapter</label>
              <select className="input" value={gift.startChapter} onChange={(e) => setGift({ ...gift, startChapter: e.target.value as ChapterId })}>
                {CHAPTERS.slice(0, 4).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">A note for them</label>
            <textarea className="input min-h-[80px]" value={gift.message} onChange={(e) => setGift({ ...gift, message: e.target.value })} placeholder="For every chapter we'll get to watch." />
          </div>
          <button className="btn-coral w-full">Send gift (demo billing)</button>
          {giftSent && <p className="text-center text-sm text-navy/70">♡ Gift saved — they&apos;ll get an invitation to start their story.</p>}
        </form>
      </section>
    </div>
  );
}
