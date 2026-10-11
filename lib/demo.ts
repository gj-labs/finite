// Demo mode: clearly-labelled placeholders so the full journey works without an Arcade key.
// Job IDs encode their start time so polling "finishes" after a few seconds, statelessly.

const DEMO_SECONDS = 6;

export function demoJob(kind: "pattern" | "product", seed: string) {
  const s = seed.replace(/[^a-z0-9]/gi, "") || "x";
  return { jobId: `demo-${kind}-${Date.now()}-${s}`, kind, status: "running", result: null, error: null };
}

export function demoJobStatus(jobId: string) {
  const [, kind, ts, seed] = jobId.split("-");
  const done = Date.now() - Number(ts) > DEMO_SECONDS * 1000;
  const id = `demo_${decodeURIComponent(seed || "x")}_${ts}`;
  return {
    jobId,
    kind,
    status: done ? "succeeded" : "running",
    result: done ? (kind === "pattern" ? { patternId: id } : { productId: id }) : null,
    error: null,
  };
}

// Friendly shortlist used only in demo mode (live mode always reads categories/list).
export const DEMO_CATEGORIES = [
  { categoryId: "demo-pillow", name: "Pillow Cover (demo)", imageUrl: null, world: "print" },
  { categoryId: "demo-bedding", name: "Duvet Cover (demo)", imageUrl: null, world: "print" },
  { categoryId: "demo-lampshade", name: "Lampshade (demo)", imageUrl: null, world: "print" },
  { categoryId: "demo-rug", name: "Rug (demo)", imageUrl: null, world: "print" },
  { categoryId: "demo-table", name: "Table Runner (demo)", imageUrl: null, world: "print" },
];

export function demoCategory(categoryId: string, selections: Record<string, string>) {
  const cat = DEMO_CATEGORIES.find((c) => c.categoryId === categoryId) || DEMO_CATEGORIES[0];
  const options = [
    {
      key: "size",
      label: "Size",
      values: [
        { value: "small", label: "Small", isDefault: false, available: true },
        { value: "medium", label: "Medium", isDefault: true, available: true },
        { value: "large", label: "Large", isDefault: false, available: true },
      ],
    },
    {
      key: "material",
      label: "Material",
      values: [
        { value: "cotton", label: "Organic cotton", isDefault: true, available: true },
        { value: "linen", label: "Linen", isDefault: false, available: true },
      ],
    },
  ];
  const full: Record<string, string> = {};
  for (const o of options) full[o.key] = selections[o.key] || o.values.find((v) => v.isDefault)!.value;
  return { categoryId: cat.categoryId, name: cat.name, world: "print", options, selections: full, canManufacture: true };
}

export function demoPendant(selections: Record<string, string>) {
  const values = ["925 Sterling Silver", "14k Gold Vermeil", "14k Yellow Gold"].map((v, i) => ({ value: v, label: v, isDefault: i === 0, available: true }));
  return {
    categoryId: "demo-pendant",
    name: "Pendant Necklace (demo)",
    world: "jewelry",
    options: [{ key: "material", label: "Material", values }],
    selections: { material: selections.material || values[0].value },
    canManufacture: true,
  };
}
