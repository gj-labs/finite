import type { ChapterId } from "./chapters";

export type Parent = { role: "mom" | "dad" | "parent"; name: string; about: string; hope: string };

export type Child = { name: string; birthDate?: string; dueDate?: string };

export type Memory = {
  id: string;
  chapter: ChapterId;
  title: string;
  date: string;
  story: string;
  tags: string[];
  photo?: string; // small data URL, optional
  createdAt: number;
};

export type DesignStatus = "draft" | "generating" | "ready" | "failed" | "approved";

export type Design = {
  id: string;
  memoryId: string;
  prompt: string;
  story: string;
  requestId?: string;
  jobId?: string;
  patternId?: string;
  status: DesignStatus;
  error?: string;
  source?: "subscription" | "parent";
  createdAt: number;
};

export type Keepsake = {
  id: string;
  designId: string;
  memoryId: string;
  categoryId: string;
  categoryName: string;
  friendlyName: string;
  selections: Record<string, string>;
  selectionLabel?: string;
  requestId: string;
  jobId?: string;
  productId?: string;
  price?: { amount: string; currency: string } | null;
  status: "building" | "ready" | "ordered" | "failed";
  error?: string;
  checkoutId?: string;
  checkoutUrl?: string | null;
  orderedAt?: number;
  createdAt: number;
};

export type Plan = "digital" | "chapters" | "heirloom";
export type Subscription = { plan: Plan; status: "active" | "paused" | "cancelled"; since: number };

export type Gift = { id: string; to: string; from: string; message: string; plan: Plan; startChapter: ChapterId; createdAt: number };

export type FiniteState = {
  child: Child;
  parents: Parent[];
  memories: Memory[];
  designs: Design[];
  keepsakes: Keepsake[];
  subscription: Subscription;
  gifts: Gift[];
  sharedChapters: ChapterId[];
};
