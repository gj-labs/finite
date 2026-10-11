import Link from "next/link";

export function HeartMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <path
        d="M16 27s-10-6.2-10-13.2C6 9.6 9 7 12.2 7c1.9 0 3.1 1 3.8 2.2C16.7 8 17.9 7 19.8 7 23 7 26 9.6 26 13.8 26 20.8 16 27 16 27Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ small = false }: { small?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-end gap-1.5 text-navy">
      <HeartMark className={small ? "mb-1 h-4 w-4 text-coral-deep" : "mb-2 h-6 w-6 text-coral-deep"} />
      <span className={`font-serif font-medium leading-none tracking-tight ${small ? "text-2xl" : "text-4xl"}`}>finite</span>
      <span className="mb-[3px] ml-1 hidden text-[10px] font-medium uppercase tracking-[0.18em] text-navy/50 sm:inline">
        built on Arcade
      </span>
    </Link>
  );
}

export function MadeWithArcade({ category }: { category?: string }) {
  return (
    <p className="text-[11px] tracking-wide text-navy/50">
      Made with Arcade{category ? ` · ${category}` : ""}
    </p>
  );
}
