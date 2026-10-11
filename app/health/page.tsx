"use client";
import { useEffect, useState } from "react";

export default function Health() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/arcade/health").then(async (r) => setData({ httpStatus: r.status, ...(await r.json()) })).catch((e) => setData({ error: String(e) }));
  }, []);
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-serif text-4xl text-navy">Arcade connection</h1>
      {!data && <div className="shimmer mt-6 h-32 rounded-2xl" />}
      {data && (
        <div className="paper mt-6 p-6">
          <p className="text-lg">
            Mode: <strong className={data.mode === "live" ? "text-sage" : "text-coral-deep"}>{data.mode || "error"}</strong>
          </p>
          {data.error && <p className="mt-2 text-sm text-coral-deep">{data.error}</p>}
          {data.categories && (
            <>
              <p className="mt-4 text-sm text-navy/60">{data.count} categories found:</p>
              <ul className="mt-2 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
                {data.categories.map((c: string) => <li key={c}>· {c}</li>)}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
