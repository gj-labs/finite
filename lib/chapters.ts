export type ChapterId = "before-birth" | "newborn" | "early-days" | "growing-up" | "future";

export type Chapter = {
  id: ChapterId;
  n: number;
  name: string;
  tagline: string;
  blurb: string;
  suggestion: string;
  tint: string; // tailwind bg class for the chapter accent
  hex: string;
};

export const CHAPTERS: Chapter[] = [
  {
    id: "before-birth",
    n: 1,
    name: "Before Birth",
    tagline: "The first heartbeat",
    blurb: "The scan, the due date, the names you whispered before you met.",
    suggestion: "What did the first heartbeat sound like to you?",
    tint: "bg-dusty-soft",
    hex: "#8FA6BF",
  },
  {
    id: "newborn",
    n: 2,
    name: "Newborn",
    tagline: "Tiny hands. Big dreams.",
    blurb: "The birth story, exactly as you tell it — weight, time, the first hold.",
    suggestion: "Tell the story of the day they arrived, the way you'd tell it to them.",
    tint: "bg-coral-soft",
    hex: "#D98B73",
  },
  {
    id: "early-days",
    n: 3,
    name: "Early Days",
    tagline: "Firsts worth keeping",
    blurb: "First smile, first word, the song that always works at 3 a.m.",
    suggestion: "What was the first word — and who heard it?",
    tint: "bg-gold-soft",
    hex: "#C9A86A",
  },
  {
    id: "growing-up",
    n: 4,
    name: "Growing Up",
    tagline: "Every chapter matters",
    blurb: "Their artwork, their hobbies, the traditions that make your family yours.",
    suggestion: "Which drawing of theirs is still on the fridge — and why?",
    tint: "bg-sage-soft",
    hex: "#9DAE94",
  },
  {
    id: "future",
    n: 5,
    name: "The Future",
    tagline: "A story they can return to",
    blurb: "Birthdays, graduations, the milestones still to come.",
    suggestion: "What do you hope they feel when they read this one day?",
    tint: "bg-cream-deep",
    hex: "#1F2A44",
  },
];

export const chapterById = (id: ChapterId) => CHAPTERS.find((c) => c.id === id)!;

export function currentChapter(birthDate?: string, dueDate?: string): ChapterId {
  if (!birthDate) return "before-birth";
  const months = (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (months < 0) return "before-birth";
  if (months < 3) return "newborn";
  if (months < 36) return "early-days";
  return "growing-up";
}

export function ageLabel(birthDate?: string, dueDate?: string) {
  if (!birthDate) return dueDate ? `Due ${fmtDate(dueDate)}` : "On the way";
  const days = Math.floor((Date.now() - new Date(birthDate).getTime()) / 86400000);
  if (days < 0) return `Due ${fmtDate(birthDate)}`;
  if (days < 14) return `${days} days old`;
  if (days < 90) return `${Math.floor(days / 7)} weeks old`;
  const months = Math.floor(days / 30.44);
  if (months < 24) return `${months} months old`;
  return `${Math.floor(months / 12)} years old`;
}

export function fmtDate(d: string) {
  try {
    return new Date(d + (d.length === 10 ? "T12:00:00" : "")).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export const MILESTONE_TAGS = ["first-smile", "first-word", "first-steps", "birthday", "milestone", "chapter-change"];
export const ALL_TAGS = [
  "heartbeat",
  "ultrasound",
  "birth-story",
  "first-smile",
  "first-word",
  "first-steps",
  "first-foods",
  "favorite-song",
  "artwork",
  "tradition",
  "birthday",
  "milestone",
];

// Map a real Arcade category name to Finite's friendly, chapter-appropriate name.
// The real name is always shown underneath in small text.
export function friendlyName(categoryName: string): string {
  const n = categoryName.toLowerCase();
  if (/(pillow|cushion)/.test(n)) return "Nursery pillow cover";
  if (/(duvet|bedding|sheet|blanket|quilt|bed)/.test(n)) return "Nursery bedding";
  if (/lamp/.test(n)) return "Story lampshade";
  if (/rug/.test(n)) return "Playroom rug";
  if (/(napkin|runner|tablecloth|table|placemat)/.test(n)) return "Family table linen";
  if (/curtain/.test(n)) return "Nursery curtains";
  if (/scarf/.test(n)) return "A scarf for Mama";
  if (/(ceramic|tile|plate|mug)/.test(n)) return "Ceramic keepsake";
  if (/glass/.test(n)) return "Celebration glassware";
  if (/(wallpaper|wall)/.test(n)) return "Nursery wall";
  return categoryName.replace(/\s*\(demo\)/i, "");
}

const SHORTLIST = [/pillow|cushion/, /duvet|bedding|sheet|blanket|quilt/, /lamp/, /rug/, /napkin|runner|tablecloth|table/, /ceramic|tile/];
export function shortlistRank(categoryName: string) {
  const n = categoryName.toLowerCase();
  const i = SHORTLIST.findIndex((r) => r.test(n));
  return i === -1 ? 99 : i;
}
