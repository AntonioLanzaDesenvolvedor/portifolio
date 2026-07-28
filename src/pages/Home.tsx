import { Navbar } from "@/components/Navbar";
import { ScrollProgress } from "@/components/effects/ScrollProgress";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { SeoHead } from "@/components/SeoHead";
import { SpaceChapter } from "@/components/SpaceChapter";
import { SpaceArc } from "@/components/SpaceArc";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Skills } from "@/components/Skills";
import { Projects } from "@/components/Projects";
import { Contact, ContactGalaxyZone } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { EntranceProvider } from "@/hooks/use-entrance";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { MotionConfig } from "framer-motion";
import { useMemo } from "react";

function prefersReduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function HomeContent() {
  useSmoothScroll(true);
  const reduced = useMemo(() => prefersReduced(), []);

  return (
    <>
      <SeoHead />
      <ParticleBackground />
      <main className="relative z-[1] min-h-screen overflow-visible text-foreground">
        <ScrollProgress />
        <Navbar />
        <SpaceChapter reduced={reduced}>
          <Hero />
          <About />
        </SpaceChapter>
        <SpaceArc>
          <Skills />
          <Projects />
        </SpaceArc>
        <ContactGalaxyZone>
          <Contact />
          <Footer />
        </ContactGalaxyZone>
      </main>
    </>
  );
}

export default function Home() {
  return (
    <MotionConfig reducedMotion="user">
      <EntranceProvider>
        <HomeContent />
      </EntranceProvider>
    </MotionConfig>
  );
}
