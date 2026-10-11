// The Finite "Loveprint" engine (v1, templated): memory + chapter + both parent personas
// → an Arcade-ready pattern prompt and the short story card that travels with the keepsake.
import { chapterById } from "./chapters";
import type { Child, Memory, Parent } from "./types";

export const PALETTE_HEX = ["#1F2A44", "#FBF6EF", "#C9A86A", "#9DAE94", "#8FA6BF", "#D98B73"];
const PALETTE_WORDS = "deep navy, warm cream, soft gold, muted sage, dusty blue and a touch of warm terracotta";

const CHAPTER_RULES: Record<string, string> = {
  "before-birth":
    "an abstract, softly flowing wave-and-ripple pattern evoking a heartbeat rhythm and the curve of a sound wave — gentle concentric arcs, tiny dots like distant stars; abstract and calm, never a literal medical scan",
  newborn:
    "a delicate scattered motif of tiny hands, small stars and soft crescent moons, like an heirloom nursery print, with gentle tonal layering",
  "early-days":
    "a joyful, airy pattern of small blooming suns, little smiles abstracted as soft arcs, and loose watercolor petals, like morning light on a nursery wall",
  "growing-up":
    "a playful but refined repeat built from a child's loose crayon-like shapes — simple houses, trees, kites and swirls — cleaned up into a tasteful hand-drawn textile print",
  future:
    "a grown-up, elegant re-issue of an early nursery motif — fine-line stars and gentle arcs — in a sophisticated, timeless composition",
};

// Pull a few concrete, visual nouns out of the parent's story to make the design specific.
const VISUAL_WORDS = [
  "sunrise","sunset","morning","moon","stars","star","rain","ocean","sea","waves","garden","flowers","flower","lavender",
  "rose","jasmine","marigold","lemon","tree","oak","birds","bird","sparrow","butterfly","window","light","snow","autumn",
  "leaves","spring","summer","river","mountain","kite","boat","lullaby","song","guitar","piano","book","blanket","sun",
];
function motifsFrom(text: string) {
  const t = text.toLowerCase();
  return VISUAL_WORDS.filter((w) => new RegExp(`\\b${w}\\b`).test(t)).slice(0, 4);
}

export function buildPrompt(memory: Memory, parents: Parent[]): string {
  const rule = CHAPTER_RULES[memory.chapter];
  const motifs = motifsFrom(`${memory.title} ${memory.story} ${parents.map((p) => p.about + " " + p.hope).join(" ")}`);
  const motifLine = motifs.length ? ` Weave in subtle hints of ${motifs.join(", ")}.` : "";
  const feeling = parents.map((p) => p.hope).filter(Boolean)[0];
  const feelLine = feeling ? ` The feeling should be: ${feeling.replace(/\.$/, "").toLowerCase()}.` : "";
  return (
    `Seamless textile pattern for a family keepsake inspired by "${memory.title}": ${rule}.${motifLine}${feelLine} ` +
    `Soft watercolor texture, editorial and calm, premium heirloom feel. Palette: ${PALETTE_WORDS}. ` +
    `No text, no letters, no numbers, no faces, no logos.`
  ).slice(0, 1000);
}

export function buildStory(memory: Memory, parents: Parent[], child: Child): string {
  const ch = chapterById(memory.chapter);
  const names = parents.map((p) => p.name).filter(Boolean);
  const who = names.length === 2 ? `${names[0]} and ${names[1]}` : names[0] || "Your family";
  const traits = parents.map((p) => p.about).filter(Boolean);
  const hope = parents.map((p) => p.hope).filter(Boolean)[0];
  const art = /^[aeiou]/i.test(ch.name) ? "an" : "a";
  const firstLine = `Made from “${memory.title}” — ${art} ${ch.name.toLowerCase()} memory, ${ch.tagline.toLowerCase().replace(/\.$/, "")}.`;
  const middle = traits.length
    ? ` ${who} — ${traits.join("; ").replace(/\.$/, "")} — wanted ${child.name || "their child"} to be able to hold this moment, not just scroll past it.`
    : ` ${who} wanted ${child.name || "their child"} to be able to hold this moment, not just scroll past it.`;
  const end = hope ? ` Their hope, woven into every thread: ${hope.replace(/\.$/, "")}.` : "";
  return firstLine + middle + end;
}

export function variationOf(prompt: string, n: number) {
  const twists = [
    "Make it lighter and more airy, with more cream space between motifs.",
    "Make the motifs a little larger and bolder, with deeper navy accents.",
    "Make it more delicate and fine-lined, with soft gold highlights.",
    "Shift the mood warmer, leaning into terracotta and gold.",
  ];
  const base = prompt.replace(/ Variation note:.*$/, "");
  return `${base} Variation note: ${twists[n % twists.length]}`.slice(0, 1000);
}
