"use client";
import { useEffect, useState } from "react";
import type { ChapterId } from "@/lib/chapters";
import { arcade } from "@/lib/client";

// Soft watercolor-style vignettes per chapter (pure SVG, no stock photos).
export function ChapterArt({ id, className = "h-24 w-24" }: { id: ChapterId; className?: string }) {
  const wash: Record<ChapterId, [string, string]> = {
    "before-birth": ["#DCE5EE", "#8FA6BF"],
    newborn: ["#F2D5C9", "#D98B73"],
    "early-days": ["#F4E6C4", "#C9A86A"],
    "growing-up": ["#DCE4D6", "#9DAE94"],
    future: ["#E3E6EE", "#1F2A44"],
  };
  const [a, b] = wash[id];
  const gid = `g-${id}`;
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <radialGradient id={gid} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#FFFDF9" />
          <stop offset="55%" stopColor={a} />
          <stop offset="100%" stopColor={b} stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill={`url(#${gid})`} />
      <circle cx="50" cy="50" r="47" fill="none" stroke={b} strokeOpacity="0.35" />
      <g stroke={id === "future" ? "#C9A86A" : "#1F2A44"} strokeOpacity="0.75" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {id === "before-birth" && (
          <>
            <path d="M18 52h14l5-12 7 26 6-20 5 10h27" />
            <path d="M50 30c-4-6-14-4-14 4 0 7 14 14 14 14s14-7 14-14c0-8-10-10-14-4Z" strokeOpacity="0.35" />
          </>
        )}
        {id === "newborn" && (
          <>
            <path d="M34 66c-6-4-8-14-4-22 2-4 6-3 6 1v-9c0-3 5-3 5 0v7-11c0-3 5-3 5 0v11-8c0-3 5-3 5 0v12c3-4 8-3 7 2-2 7-6 13-12 17-4 2-8 2-12 0Z" />
            <circle cx="66" cy="34" r="2" fill="#C9A86A" stroke="none" />
            <circle cx="72" cy="44" r="1.4" fill="#C9A86A" stroke="none" />
          </>
        )}
        {id === "early-days" && (
          <>
            <circle cx="50" cy="46" r="12" />
            <path d="M50 24v-6M50 74v-6M28 46h-6M78 46h-6M34 30l-4-4M70 30l4-4M34 62l-4 4M70 62l4 4" />
            <path d="M44 49c2 3 10 3 12 0" />
          </>
        )}
        {id === "growing-up" && (
          <>
            <path d="M26 70V50l14-12 14 12v20H26Z" />
            <path d="M36 70V58h8v12" />
            <path d="M62 70V54M62 54c-8 0-10-12 0-16 10 4 8 16 0 16Z" />
            <path d="M66 22l10 6-4 10-10-6z" />
            <path d="M68 38c-2 6 2 8-1 12" strokeOpacity="0.5" />
          </>
        )}
        {id === "future" && (
          <>
            <path d="M50 22l4.5 10 11 1-8.3 7.4 2.5 10.8L50 45.6l-9.7 5.6 2.5-10.8L34.5 33l11-1Z" />
            <path d="M26 72c8-10 40-10 48 0" strokeOpacity="0.5" />
            <circle cx="28" cy="30" r="1.5" fill="#C9A86A" stroke="none" />
            <circle cx="74" cy="58" r="1.5" fill="#C9A86A" stroke="none" />
          </>
        )}
      </g>
    </svg>
  );
}

// Deterministic placeholder pattern in the Finite palette (demo mode only).
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
export function DemoPattern({ seed, chapter, className = "" }: { seed: string; chapter?: ChapterId; className?: string }) {
  const h = hash(seed);
  const rnd = (i: number) => ((Math.imul(h + i * 7919, 2654435761) >>> 0) % 1000) / 1000;
  const colors = ["#1F2A44", "#C9A86A", "#9DAE94", "#8FA6BF", "#D98B73"];
  const bg = ["#FBF6EF", "#F6EFE4", "#F3EADF"][h % 3];
  const motifs = Array.from({ length: 26 }, (_, i) => ({
    x: rnd(i) * 200,
    y: rnd(i + 100) * 200,
    r: 4 + rnd(i + 200) * 12,
    c: colors[Math.floor(rnd(i + 300) * colors.length)],
    k: Math.floor(rnd(i + 400) * 3),
    rot: rnd(i + 500) * 360,
  }));
  const pid = `p-${h}`;
  return (
    <svg viewBox="0 0 200 200" className={className} preserveAspectRatio="xMidYMid slice" aria-label="Demo pattern placeholder">
      <defs>
        <filter id={`${pid}-soft`}>
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>
      <rect width="200" height="200" fill={bg} />
      {chapter === "before-birth" &&
        Array.from({ length: 9 }, (_, i) => (
          <path
            key={i}
            d={`M-10 ${20 + i * 22} C 40 ${8 + i * 22 + rnd(i) * 10}, 80 ${32 + i * 22}, 120 ${20 + i * 22} S 190 ${10 + i * 22}, 220 ${22 + i * 22}`}
            stroke={colors[(i + h) % colors.length]}
            strokeOpacity="0.45"
            strokeWidth="2"
            fill="none"
          />
        ))}
      <g filter={`url(#${pid}-soft)`}>
        {motifs.map((m, i) =>
          m.k === 0 ? (
            <circle key={i} cx={m.x} cy={m.y} r={m.r * 0.6} fill={m.c} fillOpacity="0.28" />
          ) : m.k === 1 ? (
            <path
              key={i}
              transform={`translate(${m.x} ${m.y}) rotate(${m.rot}) scale(${m.r / 10})`}
              d="M0 -8 C 5 -8 8 -3 8 0 C 8 5 3 8 0 8 C 4 4 4 -4 0 -8Z"
              fill={m.c}
              fillOpacity="0.5"
            />
          ) : (
            <path
              key={i}
              transform={`translate(${m.x} ${m.y}) rotate(${m.rot}) scale(${m.r / 14})`}
              d="M0 -10 L2.4 -3 L10 -3 L4 1.8 L6.2 9 L0 4.8 L-6.2 9 L-4 1.8 L-10 -3 L-2.4 -3Z"
              fill={m.c}
              fillOpacity="0.55"
            />
          )
        )}
      </g>
    </svg>
  );
}

// Shows a pattern: re-fetches the short-lived Arcade image URL every time (we only store patternId).
export function PatternImage({
  patternId,
  chapter,
  className = "",
}: {
  patternId: string;
  chapter?: ChapterId;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const demo = patternId.startsWith("demo_");
  useEffect(() => {
    if (demo) return;
    let alive = true;
    arcade<{ imageUrl: string | null }>("pattern-image", { patternId })
      .then((p) => alive && setUrl(p.imageUrl))
      .catch(() => alive && setErr(true));
    return () => {
      alive = false;
    };
  }, [patternId, demo]);

  if (demo)
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <DemoPattern seed={patternId} chapter={chapter} className="h-full w-full" />
        <span className="absolute left-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-navy/70">
          Demo placeholder
        </span>
      </div>
    );
  if (err)
    return <div className={`flex items-center justify-center bg-cream-deep text-xs text-navy/50 ${className}`}>Image unavailable — refresh</div>;
  if (!url) return <div className={`shimmer ${className}`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="Arcade-generated keepsake pattern" className={`object-cover ${className}`} />;
}
