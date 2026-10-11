"use client";
import { useState } from "react";
import { ALL_TAGS, CHAPTERS, type ChapterId } from "@/lib/chapters";
import { useStore } from "@/lib/store";

export function AddMemory({ defaultChapter, onClose }: { defaultChapter: ChapterId; onClose: () => void }) {
  const { addMemory, state } = useStore();
  const [chapter, setChapter] = useState<ChapterId>(defaultChapter);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [story, setStory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | undefined>();
  const suggestion = CHAPTERS.find((c) => c.id === chapter)!.suggestion;

  function onPhoto(f?: File) {
    if (!f) return;
    // Downscale so it fits comfortably in local storage.
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const max = 640;
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = img.width * s;
        c.height = img.height * s;
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        setPhoto(c.toDataURL("image/jpeg", 0.75));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(f);
  }

  function save() {
    if (!title.trim() || !story.trim()) return;
    addMemory({ chapter, title: title.trim(), date, story: story.trim(), tags, photo });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/30 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="paper max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-b-none p-6 sm:rounded-b-[1.25rem]" onClick={(e) => e.stopPropagation()}>
        <p className="eyebrow">Add a memory</p>
        <h2 className="mt-1 font-serif text-3xl text-navy">What&apos;s a moment you never want to forget?</h2>
        <p className="mt-1 font-serif text-lg italic text-navy/60">{suggestion}</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="label">Chapter</label>
            <select className="input" value={chapter} onChange={(e) => setChapter(e.target.value as ChapterId)}>
              {CHAPTERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.n}. {c.name} — {c.tagline}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <label className="label">Title</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`${state.child.name}'s first word`} />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">The story, in your words</label>
            <textarea
              className="input min-h-[140px] leading-relaxed"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Where were you? Who was there? What did it sound like, smell like, feel like?"
            />
          </div>
          <div>
            <label className="label">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_TAGS.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    tags.includes(t) ? "border-navy bg-navy text-cream" : "border-navy/15 text-navy/70 hover:border-navy/40"
                  }`}
                >
                  {t.replace("-", " ")}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-navy/50">Tag a first, a birthday or a milestone and Finite Chapters drafts your next keepsake from it.</p>
          </div>
          <div>
            <label className="label">Photo or artwork (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => onPhoto(e.target.files?.[0])} className="text-sm text-navy/70" />
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="mt-2 h-24 rounded-lg object-cover" />
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save} disabled={!title.trim() || !story.trim()}>
            Save memory
          </button>
        </div>
        <p className="mt-4 text-center text-[11px] text-navy/45">Private by default. Nothing is shared or made until you tap it.</p>
      </div>
    </div>
  );
}
