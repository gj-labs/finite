import Link from "next/link";
import { CHAPTERS } from "@/lib/chapters";
import { ChapterArt, DemoPattern } from "@/components/Art";
import { HeartMark } from "@/components/Brand";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="wash relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-20 pt-14 md:grid-cols-[1.1fr_0.9fr] md:pt-24">
          <div>
            <div className="flex items-end gap-2 text-navy">
              <HeartMark className="mb-3 h-9 w-9 text-coral-deep" />
              <span className="font-serif text-7xl font-medium leading-none tracking-tight md:text-8xl">finite</span>
            </div>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-navy/50">built on Arcade</p>
            <h1 className="mt-8 font-serif text-4xl leading-[1.08] text-navy md:text-6xl">
              From first heartbeat
              <br />
              to big dreams.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-navy/75 md:text-lg">
              Keep every chapter close — turn your child&apos;s memories into keepsakes made only for your family, and a story
              they can return to.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/story" className="btn-primary">
                Start your child&apos;s story
              </Link>
              <Link href="/story?demo=1" className="btn-ghost">
                See Siya&apos;s story →
              </Link>
            </div>
          </div>

          {/* keepsake vignette */}
          <div className="relative mx-auto aspect-square w-full max-w-md">
            <div className="absolute inset-6 rotate-[-4deg] overflow-hidden rounded-[2rem] shadow-soft">
              <DemoPattern seed="hero-heartbeat" chapter="before-birth" className="h-full w-full" />
            </div>
            <div className="absolute bottom-0 right-0 w-56 rotate-[3deg] rounded-2xl bg-white/95 p-4 shadow-soft">
              <p className="font-hand text-xl leading-snug text-navy/80">
                “She smiled at him eleven times. We counted.”
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-navy/50">First smile → nursery pillow</p>
            </div>
            <p className="absolute -top-2 left-2 rotate-[-6deg] font-hand text-2xl text-navy/60">Same love, new chapters ♡</p>
          </div>
        </div>
      </section>

      {/* Journey timeline */}
      <section className="mx-auto max-w-4xl px-4 py-20">
        <p className="eyebrow text-center">The journey</p>
        <h2 className="mt-3 text-center font-serif text-4xl text-navy md:text-5xl">Five chapters, one story</h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-navy/70">
          From the first spark of life to the adventures ahead — every milestone can become something you hold.
        </p>
        <ol className="relative mt-14 space-y-8 before:absolute before:left-[47px] before:top-4 before:h-[calc(100%-2rem)] before:w-px before:bg-gradient-to-b before:from-dusty before:via-gold before:to-navy/40 md:before:left-1/2">
          {CHAPTERS.map((c, i) => (
            <li key={c.id} className={`relative flex items-center gap-6 md:w-1/2 ${i % 2 ? "md:ml-auto md:pl-14" : "md:flex-row-reverse md:pr-14 md:text-right"}`}>
              <div className={`relative z-10 shrink-0 md:absolute md:top-1/2 md:-translate-y-1/2 ${i % 2 ? "md:-left-12" : "md:-right-12"}`}>
                <ChapterArt id={c.id} className="h-24 w-24 drop-shadow-sm" />
              </div>
              <Link href={`/story#${c.id}`} className="paper block flex-1 p-5 transition hover:-translate-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-navy/45">Chapter {c.n}</p>
                <h3 className="mt-1 font-serif text-2xl text-navy">{c.name}</h3>
                <p className="font-serif text-lg italic text-coral-deep">{c.tagline}</p>
                <p className="mt-2 text-sm text-navy/65">{c.blurb}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* How it works */}
      <section className="bg-cream-deep/60 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <p className="eyebrow text-center">How it works</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Share a memory", "The heartbeat, the birth story, the first word — in your own words. Private by default."],
              ["We design it for you", "Finite reads the moment and who you are as parents, and Arcade turns it into a one-of-one pattern."],
              ["Made for your family", "Manufactured on demand by Arcade’s makers and delivered home — with a QR code back to the story."],
            ].map(([t, d], i) => (
              <div key={t} className="paper p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-coral-soft font-serif text-lg text-coral-deep">{i + 1}</span>
                <h3 className="mt-4 font-serif text-2xl text-navy">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy/70">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription band */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="overflow-hidden rounded-[2rem] bg-navy px-8 py-12 text-cream md:px-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Finite Chapters</p>
          <h2 className="mt-3 max-w-2xl font-serif text-4xl leading-tight md:text-5xl">
            The next keepsake arrives when life happens — not on a billing cycle.
          </h2>
          <p className="mt-4 max-w-xl text-cream/75">
            Log a first, a birthday, a new chapter. Finite drafts the keepsake; you approve it before anything is made. Pause or
            cancel in one tap.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/chapters" className="btn bg-gold text-navy hover:bg-gold-soft">
              See the plans
            </Link>
            <Link href="/chapters#gift" className="btn border border-cream/30 text-cream hover:bg-white/10">
              Gift it to a new family
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
