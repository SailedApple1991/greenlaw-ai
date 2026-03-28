"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

/* ─── Brand Constants ─── */
const BRAND = {
  dark: "#1ba577",
  light: "#9dd3c0",
} as const;

/* ─── Intersection Observer Hook ─── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/* ─── Logo Component ─── */
function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 84.785 73.288"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon
        points="48.622 0 48.622 72.327 84.785 36.164 48.622 0"
        fill={BRAND.light}
      />
      <polygon
        points="60.741 37.124 24.577 .96 24.577 25.538 36.164 37.124 24.577 48.71 24.577 73.288 60.741 37.124"
        fill={BRAND.dark}
      />
      <polygon
        points="0 .96 0 12.679 24.445 37.124 0 61.569 0 73.288 24.577 48.71 24.577 25.538 0 .96"
        fill={BRAND.dark}
      />
    </svg>
  );
}

/* ─── Animated Hero Logo (directional piece assembly with snap) ─── */
function AnimatedHeroLogo() {
  return (
    <div className="relative w-20 h-17 md:w-32 md:h-28 motion-reduce:!animate-none">
      {/* Glow backdrop */}
      <div className="absolute inset-0 animate-hero-glow motion-reduce:opacity-60 motion-reduce:!animate-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 md:w-44 md:h-44 bg-emerald-400/15 dark:bg-emerald-500/12 rounded-full blur-3xl" />
      </div>

      <svg
        className="w-full h-full relative z-10"
        viewBox="0 0 84.785 73.288"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="SustainNexus logo"
      >
        <polygon
          className="animate-color-shift-1 motion-reduce:!animate-none motion-reduce:fill-[#1ba577]"
          points="0 .96 0 12.679 24.445 37.124 0 61.569 0 73.288 24.577 48.71 24.577 25.538 0 .96"
        />
        <polygon
          className="animate-color-shift-2 motion-reduce:!animate-none motion-reduce:fill-[#1ba577]"
          points="60.741 37.124 24.577 .96 24.577 25.538 36.164 37.124 24.577 48.71 24.577 73.288 60.741 37.124"
        />
        <polygon
          className="animate-color-shift-3 motion-reduce:!animate-none motion-reduce:fill-[#9dd3c0]"
          points="48.622 0 48.622 72.327 84.785 36.164 48.622 0"
        />
      </svg>
    </div>
  );
}

/* ─── Reveal Wrapper ─── */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── Data ─── */
const FEATURES = [
  {
    title: "Deep Regulatory Knowledge",
    description:
      "Covers EU ETS, CSRD, CBAM, Taxonomy Regulation, and more — trained on authoritative legal sources.",
  },
  {
    title: "AI-Powered Answers",
    description:
      "Get instant, contextual responses powered by RAG technology — no more hours of manual research.",
  },
  {
    title: "Source Citations",
    description:
      "Every answer is backed by traceable citations from official EU legal documents and directives.",
  },
  {
    title: "Multi-Session Chat",
    description:
      "Maintain multiple conversation threads with full history — pick up right where you left off.",
  },
  {
    title: "Real-Time Streaming",
    description:
      "Watch answers appear in real time — no waiting for the full response to generate.",
  },
  {
    title: "Secure & Private",
    description:
      "Your conversations stay private. No data is shared with third parties or used for training.",
  },
];

const REGULATIONS = [
  { abbr: "EU ETS", name: "Emissions Trading System" },
  { abbr: "CSRD", name: "Corporate Sustainability Reporting" },
  { abbr: "CBAM", name: "Carbon Border Adjustment" },
  { abbr: "Taxonomy", name: "EU Taxonomy Regulation" },
  { abbr: "SFDR", name: "Sustainable Finance Disclosure" },
  { abbr: "RED III", name: "Renewable Energy Directive" },
];

const STEPS = [
  {
    num: "01",
    title: "Ask a Question",
    description:
      "Type your question about any EU environmental regulation in plain language.",
  },
  {
    num: "02",
    title: "AI Retrieves Context",
    description:
      "Our RAG system searches authoritative EU legal documents for the most relevant information.",
  },
  {
    num: "03",
    title: "Get Cited Answers",
    description:
      "Receive a clear, structured answer with inline citations linking to the original legal sources.",
  },
];

const PLATFORMS = [
  {
    title: "Carbon Account & Management",
    action: "Measure & Reduce Carbon Emissions",
    accent: "bg-emerald-100 dark:bg-emerald-950/40",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <text x="2" y="11" fontSize="7" fontWeight="700" fill="#059669" stroke="none" fontFamily="sans-serif">CO</text>
        <text x="13.5" y="14" fontSize="5" fontWeight="700" fill="#059669" stroke="none" fontFamily="sans-serif">2</text>
        <path d="M4 18 Q8 14 12 16 Q16 18 20 15" stroke="#34d399" strokeWidth="1.5" fill="none" />
        <path d="M4 20 Q8 16.5 12 18 Q16 19.5 20 17" stroke="#a7f3d0" strokeWidth="1" fill="none" opacity="0.6" />
      </svg>
    ),
  },
  {
    title: "ESG Data Management",
    action: "Streamline ESG Reporting",
    accent: "bg-sky-100 dark:bg-sky-950/40",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="14" width="3" height="6" rx="0.5" fill="#7dd3fc" />
        <rect x="9" y="10" width="3" height="10" rx="0.5" fill="#38bdf8" />
        <rect x="14" y="6" width="3" height="14" rx="0.5" fill="#0ea5e9" />
        <rect x="19" y="3" width="3" height="17" rx="0.5" fill="#0284c7" />
      </svg>
    ),
  },
  {
    title: "Product Lifecycle Assessment",
    action: "Evaluate Environmental Impact",
    accent: "bg-amber-100 dark:bg-amber-950/40",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 0 1 0 20" stroke="#f59e0b" strokeWidth="1.5" />
        <path d="M12 22a10 10 0 0 1 0-20" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 2" />
        <path d="M16 8l2-2m0 0l-1-1m1 1l1-1" stroke="#d97706" strokeWidth="1.5" />
        <path d="M8 16l-2 2m0 0l1 1m-1-1l-1 1" stroke="#d97706" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="2.5" fill="#fcd34d" opacity="0.5" />
      </svg>
    ),
  },
];

/* ─── Navbar ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Regulations", href: "#regulations" },
    { label: "How it Works", href: "#how-it-works" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-stone-50/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-stone-200/60 dark:border-gray-800/60"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 h-14 md:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Logo className="w-7 h-7 transition-transform group-hover:scale-105" />
          <span className="text-2xl md:text-[28px] font-bold tracking-tight font-brand leading-none">
            <span className="text-[#1ba577]">Sustain</span>
            <span className="text-[#9dd3c0]">Nexus</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[13px] font-medium text-stone-500 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/chat"
            className="px-5 py-2 text-[13px] font-semibold text-white bg-[#1ba577] hover:bg-emerald-600 transition-colors rounded-lg"
          >
            Try It Free
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 -mr-2 rounded-lg hover:bg-stone-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5 text-stone-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-stone-50/95 dark:bg-gray-950/95 backdrop-blur-xl border-b border-stone-200 dark:border-gray-800 px-5 pb-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-sm font-medium text-stone-600 dark:text-gray-400 hover:text-[#1ba577]"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/chat"
            className="mt-2 block text-center px-5 py-2.5 text-sm font-semibold text-white bg-[#1ba577] rounded-lg"
          >
            Try It Free
          </Link>
        </div>
      )}
    </nav>
  );
}

/* ─── Page ─── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8faf8] dark:bg-gray-950 font-display overflow-x-hidden">
      <Navbar />

      {/* ── Hero ── */}
      <header className="relative pt-20 pb-12 md:pt-36 md:pb-24 overflow-hidden">
        {/* Subtle background — single soft wash, no blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[70%] h-[80%] bg-gradient-to-bl from-emerald-50/80 via-transparent to-transparent dark:from-emerald-950/20 rounded-full" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1ba57704_1px,transparent_1px),linear-gradient(to_bottom,#1ba57704_1px,transparent_1px)] bg-[size:80px_80px]" />
        </div>

        <div className="max-w-6xl mx-auto px-5">
          {/* Mobile: stacked. Desktop: two-column asymmetric */}
          <div className="md:grid md:grid-cols-[1fr_0.85fr] md:gap-16 md:items-center">

            {/* Left column — text */}
            <div>
              <div className="flex items-center gap-3 mb-6 animate-fade-in-up-1">
                <AnimatedHeroLogo />
              </div>

              <h1 className="text-[clamp(2rem,6vw,3.75rem)] leading-[1.08] font-extrabold tracking-tight text-stone-900 dark:text-white mb-5 animate-fade-in-up-2">
                Navigate EU ESG
                <br />
                Law &amp; Policy
                <br />
                <span className="text-[#1ba577]">with AI</span>
              </h1>

              <p className="text-base md:text-lg text-stone-500 dark:text-gray-400 leading-relaxed max-w-lg mb-8 animate-fade-in-up-3">
                Instant, cited answers on EU environmental regulations.
                Built for compliance teams, legal professionals, and
                sustainability strategists.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up-4">
                <Link
                  href="/chat"
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3 text-[15px] font-semibold text-white bg-[#1ba577] hover:bg-emerald-600 transition-colors rounded-lg"
                >
                  Start Asking Questions
                  <span className="inline-block transition-transform group-hover:translate-x-0.5">&rarr;</span>
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center px-6 py-3 text-[15px] font-semibold text-stone-600 dark:text-gray-300 border border-stone-300 dark:border-gray-700 hover:border-stone-400 dark:hover:border-gray-500 transition-colors rounded-lg"
                >
                  See How It Works
                </a>
              </div>
            </div>

            {/* Right column — chat preview (desktop only, inline) */}
            <div className="hidden md:block animate-fade-in-up-5">
              <div className="rounded-xl border border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl shadow-stone-200/40 dark:shadow-black/20 overflow-hidden">
                {/* Minimal top bar */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-stone-100 dark:border-gray-800">
                  <Logo className="w-4 h-4" />
                  <span className="text-xs font-semibold text-stone-400 dark:text-gray-500 font-brand">SustainNexus</span>
                </div>
                <div className="p-5 space-y-3 text-left">
                  <div className="flex justify-end">
                    <div className="px-4 py-2.5 rounded-xl rounded-br-sm bg-[#1ba577] text-white text-[13px] leading-relaxed max-w-[85%]">
                      What are the key reporting requirements under the CSRD?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="px-4 py-3 rounded-xl rounded-bl-sm bg-stone-100 dark:bg-gray-800 text-[13px] leading-relaxed text-stone-700 dark:text-gray-300 max-w-[90%] space-y-2">
                      <p>
                        The <strong className="text-stone-900 dark:text-white">Corporate Sustainability Reporting Directive (CSRD)</strong> requires companies to report on:
                      </p>
                      <ul className="list-disc ml-4 space-y-0.5 text-stone-500 dark:text-gray-400 text-[12px]">
                        <li>Environmental impact and climate targets</li>
                        <li>Social and governance factors</li>
                        <li>Due diligence processes</li>
                      </ul>
                      <div className="flex gap-1.5 mt-2">
                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
                          [1] Directive 2022/2464
                        </span>
                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
                          [2] ESRS Standards
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Platforms ── */}
      <Reveal>
        <section className="py-10 md:py-16">
          <div className="max-w-6xl mx-auto px-5">
            <p className="text-[11px] font-semibold text-stone-400 dark:text-gray-500 tracking-[0.15em] uppercase mb-5">
              Integrated Sustainability Platforms
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PLATFORMS.map((p, i) => (
                <Reveal key={i} delay={i * 80}>
                  <a
                    href="#"
                    className="group flex items-start gap-4 p-4 rounded-lg border border-stone-200 dark:border-gray-800 hover:border-[#1ba577]/40 bg-white dark:bg-gray-900 transition-colors"
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${p.accent} flex items-center justify-center transition-transform group-hover:scale-105`}>
                      {p.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-stone-800 dark:text-white leading-snug">
                        {p.title}
                      </h3>
                      <p className="text-xs text-stone-400 dark:text-gray-500 mt-0.5">
                        {p.action} &rarr;
                      </p>
                    </div>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Features — alternating list, not cards ── */}
      <section id="features" className="py-14 md:py-24">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal>
            <div className="max-w-2xl mb-12 md:mb-16">
              <p className="text-[11px] font-semibold text-[#1ba577] tracking-[0.15em] uppercase mb-2">
                Capabilities
              </p>
              <h2 className="text-2xl md:text-[2.5rem] font-bold text-stone-900 dark:text-white leading-tight">
                Built for legal research,
                <br className="hidden md:block" />
                not generic chat
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-x-16 gap-y-8 md:gap-y-10">
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="group flex gap-4 items-baseline">
                  <span className="flex-shrink-0 text-[13px] font-bold text-[#1ba577]/60 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-stone-800 dark:text-white mb-1">
                      {f.title}
                    </h3>
                    <p className="text-sm text-stone-500 dark:text-gray-400 leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Regulations — horizontal flow, not card grid ── */}
      <section
        id="regulations"
        className="py-14 md:py-24 border-y border-stone-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900/50"
      >
        <div className="max-w-6xl mx-auto px-5">
          <Reveal>
            <div className="md:grid md:grid-cols-[1fr_1.5fr] md:gap-16 md:items-start">
              {/* Left — heading */}
              <div className="mb-8 md:mb-0 md:sticky md:top-28">
                <p className="text-[11px] font-semibold text-[#1ba577] tracking-[0.15em] uppercase mb-2">
                  Coverage
                </p>
                <h2 className="text-2xl md:text-[2.5rem] font-bold text-stone-900 dark:text-white leading-tight mb-3">
                  EU Regulations
                  <br className="hidden md:block" />
                  We Cover
                </h2>
                <p className="text-sm text-stone-500 dark:text-gray-400 leading-relaxed max-w-sm">
                  Authoritative knowledge across the most critical EU
                  environmental regulations and directives.
                </p>
              </div>

              {/* Right — regulation items */}
              <div className="space-y-3">
                {REGULATIONS.map((reg, i) => (
                  <Reveal key={reg.abbr} delay={i * 60}>
                    <div className="group flex items-center justify-between p-4 md:p-5 rounded-lg border border-stone-200 dark:border-gray-800 hover:border-[#1ba577]/40 transition-colors bg-stone-50 dark:bg-gray-900">
                      <div className="flex items-center gap-4">
                        <span className="text-lg md:text-xl font-bold text-stone-900 dark:text-white group-hover:text-[#1ba577] transition-colors min-w-[5rem]">
                          {reg.abbr}
                        </span>
                        <span className="text-sm text-stone-500 dark:text-gray-400">
                          {reg.name}
                        </span>
                      </div>
                      <svg
                        className="w-4 h-4 text-stone-300 dark:text-gray-600 group-hover:text-[#1ba577] transition-colors flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── How It Works — numbered timeline ── */}
      <section id="how-it-works" className="py-14 md:py-24">
        <div className="max-w-4xl mx-auto px-5">
          <Reveal>
            <div className="max-w-2xl mb-12">
              <p className="text-[11px] font-semibold text-[#1ba577] tracking-[0.15em] uppercase mb-2">
                Process
              </p>
              <h2 className="text-2xl md:text-[2.5rem] font-bold text-stone-900 dark:text-white leading-tight">
                Three steps to
                <br className="hidden md:block" />
                cited answers
              </h2>
            </div>
          </Reveal>

          <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
            {STEPS.map((s, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="relative">
                  {/* Connecting line on desktop */}
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-5 left-full w-8 h-px bg-stone-200 dark:bg-gray-800" />
                  )}
                  <div className="text-[2.5rem] md:text-[3rem] font-extrabold text-stone-100 dark:text-gray-800 leading-none mb-2 select-none">
                    {s.num}
                  </div>
                  <h3 className="text-base font-semibold text-stone-800 dark:text-white mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm text-stone-500 dark:text-gray-400 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA — clean, no gradient box ── */}
      <Reveal>
        <section className="py-14 md:py-24 border-t border-stone-200/60 dark:border-gray-800/60">
          <div className="max-w-3xl mx-auto px-5 text-center">
            <Logo className="w-10 h-10 mx-auto mb-5 opacity-40" />
            <h2 className="text-2xl md:text-[2.5rem] font-bold text-stone-900 dark:text-white leading-tight mb-4">
              Ready to simplify
              <br />
              your legal research?
            </h2>
            <p className="text-base text-stone-500 dark:text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
              Stop spending hours searching through EU regulations. Get
              accurate, cited answers in seconds.
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-[15px] font-semibold text-white bg-[#1ba577] hover:bg-emerald-600 transition-colors rounded-lg"
            >
              Get Started for Free
              <span>&rarr;</span>
            </Link>
          </div>
        </section>
      </Reveal>

      {/* ── Mobile chat preview — shown only on mobile ── */}
      <div className="md:hidden px-5 pb-12">
        <div className="rounded-xl border border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-lg shadow-stone-200/30 dark:shadow-black/20">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-stone-100 dark:border-gray-800">
            <Logo className="w-4 h-4" />
            <span className="text-xs font-semibold text-stone-400 dark:text-gray-500 font-brand">SustainNexus</span>
          </div>
          <div className="p-4 space-y-3 text-left">
            <div className="flex justify-end">
              <div className="px-3.5 py-2 rounded-xl rounded-br-sm bg-[#1ba577] text-white text-[13px] leading-relaxed max-w-[85%]">
                What are the CSRD reporting requirements?
              </div>
            </div>
            <div className="flex justify-start">
              <div className="px-3.5 py-2.5 rounded-xl rounded-bl-sm bg-stone-100 dark:bg-gray-800 text-[13px] text-stone-600 dark:text-gray-300 max-w-[90%]">
                The <strong className="text-stone-800 dark:text-white">CSRD</strong> requires reporting on environmental impact, social factors, and due diligence processes...
                <span className="inline-flex ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                  [1]
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="py-8 border-t border-stone-200/60 dark:border-gray-800/60">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo className="w-5 h-5" />
              <span className="text-sm font-bold font-brand">
                <span className="text-[#1ba577]">Sustain</span>
                <span className="text-[#9dd3c0]">Nexus</span>
              </span>
            </div>
            <p className="text-xs text-stone-400 dark:text-gray-600">
              &copy; {new Date().getFullYear()} SustainNexus. ESG Regulatory
              Intelligence &amp; Sustainability Strategy Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
