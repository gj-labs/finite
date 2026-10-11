import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { ModeBanner, Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Finite — built on Arcade",
  description: "From first heartbeat to big dreams — turn your child's memories into one-of-one keepsakes, made by Arcade.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <StoreProvider>
          <ModeBanner />
          <Nav />
          <main>{children}</main>
          <footer className="no-print mt-24 border-t border-navy/10 px-4 py-10 text-center text-xs text-navy/50">
            <p className="font-serif text-lg italic text-navy/70">They may grow up, but they&apos;ll always be your baby.</p>
            <p className="mt-2">Finite · built on Arcade · memories are private by default — nothing is shared or made until you tap it.</p>
          </footer>
        </StoreProvider>
      </body>
    </html>
  );
}
