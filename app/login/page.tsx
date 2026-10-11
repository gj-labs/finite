"use client";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginCard() {
  const params = useSearchParams();
  const error = params.get("error");
  const callbackUrl = params.get("callbackUrl") || "/";
  return (
    <div className="mx-auto mt-24 max-w-sm rounded-2xl bg-white/70 p-8 text-center shadow-soft">
      <h1 className="font-serif text-3xl text-navy">Welcome to Finite</h1>
      <p className="mt-2 text-sm text-navy/60">Sign in to see your family&apos;s story.</p>
      {error && (
        <p className="mt-4 rounded-lg bg-coral-soft px-3 py-2 text-xs text-navy">
          {error === "AccessDenied" ? "That Google account isn't on the invite list." : "Sign-in didn't work. Please try again."}
        </p>
      )}
      <button
        onClick={() => signIn("google", { callbackUrl })}
        className="mt-6 w-full rounded-full bg-navy px-4 py-2.5 text-sm text-cream transition hover:bg-navy-soft"
      >
        Continue with Google
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginCard />
    </Suspense>
  );
}
