import type { FiniteState } from "./types";

// Siya's family — the demo family, so the app is never empty.
export function seedState(): FiniteState {
  return {
    child: { name: "Siya", birthDate: "2026-07-03" },
    parents: [
      {
        role: "mom",
        name: "Maya",
        about: "a night-owl illustrator who hums old Hindi film songs while she works",
        hope: "that she always knows how loved she was, even before she arrived",
      },
      {
        role: "dad",
        name: "Sam",
        about: "a quiet early-riser who makes the coffee and keeps the garden going",
        hope: "that she grows up brave, curious and kind",
      },
    ],
    memories: [
      {
        id: "m-heartbeat",
        chapter: "before-birth",
        title: "The first heartbeat",
        date: "2026-01-09",
        story:
          "Twelve weeks. The room was dark and cold and Sam was holding my hand too tightly. Then the sound came — fast, like galloping horses, like someone running toward us. The technician smiled and turned it up. Sam laughed out loud and then went completely quiet. I remember the screen glowing like moonlight and thinking: there you are. We played the recording in the car four times before we drove home.",
        tags: ["heartbeat", "ultrasound"],
        createdAt: 1,
      },
      {
        id: "m-birth",
        chapter: "newborn",
        title: "Siya arrives",
        date: "2026-07-03",
        story:
          "4:12 a.m., July 3rd. 7 lb 2 oz, 19½ inches of pure opinion. It had been raining all night and the first light was just coming through the hospital window when they put her on my chest. She stopped crying the second she heard my voice. Sam cut the cord with shaking hands and said her name out loud for the first time — Siya — like he was introducing her to the whole world.",
        tags: ["birth-story"],
        createdAt: 2,
      },
      {
        id: "m-smile",
        chapter: "early-days",
        title: "Her first real smile",
        date: "2026-09-14",
        story:
          "Sunday morning in the garden, Sam singing badly to her while he watered the lavender. She looked straight at him and smiled — not a gas smile, a real one, with her whole face and both fists. He dropped the hose. We spent the rest of the morning on the grass trying to make her do it again. She did, eleven times. We counted.",
        tags: ["first-smile"],
        createdAt: 3,
      },
    ],
    designs: [],
    keepsakes: [],
    subscription: { plan: "digital", status: "active", since: Date.now() },
    gifts: [],
    sharedChapters: [],
  };
}
