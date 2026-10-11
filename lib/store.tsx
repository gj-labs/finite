"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { seedState } from "./seed";
import { MILESTONE_TAGS } from "./chapters";
import { buildPrompt, buildStory } from "./brief";
import type { Design, FiniteState, Keepsake, Memory } from "./types";

const KEY = "finite-v1";

type Ctx = {
  state: FiniteState;
  ready: boolean;
  set: (fn: (s: FiniteState) => FiniteState) => void;
  addMemory: (m: Omit<Memory, "id" | "createdAt">) => Memory;
  upsertDesign: (d: Design) => void;
  upsertKeepsake: (k: Keepsake) => void;
  resetDemo: () => void;
};

const StoreCtx = createContext<Ctx | null>(null);

export const uid = (p = "") => p + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FiniteState>(seedState);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      let raw = localStorage.getItem(KEY);
      // The demo child was renamed Aria → Siya; carry saved demo data (and pre-baked designs) across.
      if (raw && JSON.parse(raw).child?.name === "Aria") raw = raw.replace(/\bAria\b/g, "Siya");
      if (raw) setState(JSON.parse(raw));
    } catch {}
    loaded.current = true;
    setReady(true);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const set = useCallback((fn: (s: FiniteState) => FiniteState) => setState((s) => fn(s)), []);

  const addMemory = useCallback((m: Omit<Memory, "id" | "createdAt">) => {
    const mem: Memory = { ...m, id: uid("m-"), createdAt: Date.now() };
    setState((s) => {
      const next = { ...s, memories: [...s.memories, mem] };
      // Chapter-trigger engine: a milestone memory queues the next subscription keepsake draft.
      if (mem.tags.some((t) => MILESTONE_TAGS.includes(t))) {
        const draft: Design = {
          id: uid("d-"),
          memoryId: mem.id,
          prompt: buildPrompt(mem, s.parents),
          story: buildStory(mem, s.parents, s.child),
          status: "draft",
          source: "subscription",
          createdAt: Date.now(),
        };
        next.designs = [...s.designs, draft];
      }
      return next;
    });
    return mem;
  }, []);

  const upsertDesign = useCallback((d: Design) => {
    setState((s) => {
      const exists = s.designs.some((x) => x.id === d.id);
      return { ...s, designs: exists ? s.designs.map((x) => (x.id === d.id ? d : x)) : [...s.designs, d] };
    });
  }, []);

  const upsertKeepsake = useCallback((k: Keepsake) => {
    setState((s) => {
      const exists = s.keepsakes.some((x) => x.id === k.id);
      return { ...s, keepsakes: exists ? s.keepsakes.map((x) => (x.id === k.id ? k : x)) : [...s.keepsakes, k] };
    });
  }, []);

  const resetDemo = useCallback(() => setState(seedState()), []);

  return (
    <StoreCtx.Provider value={{ state, ready, set, addMemory, upsertDesign, upsertKeepsake, resetDemo }}>
      {children}
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}
