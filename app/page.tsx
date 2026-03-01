"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

/* ─── Brand Constants ─── */
const BRAND = {
  dark: "#1ba577",
  light: "#9dd3c0",
} as const;

/* ─── Floating Logo Shape ─── */
interface FloatingShapeProps {
  className?: string;
  size?: number;
  opacity?: number;
  variant?: "full" | "chevron-left" | "chevron-right" | "arrow";
  delay?: string;
  duration?: string;
}

function FloatingShape({
  className = "",
  size = 60,
  opacity = 0.12,
  variant = "full",
  delay = "0s",
  duration = "20s",
}: FloatingShapeProps) {
  const shapes: Record<string, React.ReactNode> = {
    full: (
      <svg
        width={size}
        height={size * 0.864}
        viewBox="0 0 84.785 73.288"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon
          points="48.622 0 48.622 72.327 84.785 36.164 48.622 0"
          fill={BRAND.light}
          opacity={opacity}
        />
        <polygon
          points="60.741 37.124 24.577 .96 24.577 25.538 36.164 37.124 24.577 48.71 24.577 73.288 60.741 37.124"
          fill={BRAND.dark}
          opacity={opacity}
        />
        <polygon
          points="0 .96 0 12.679 24.445 37.124 0 61.569 0 73.288 24.577 48.71 24.577 25.538 0 .96"
          fill={BRAND.dark}
          opacity={opacity}
        />
      </svg>
    ),
    "chevron-left": (
      <svg
        width={size * 0.4}
        height={size * 0.864}
        viewBox="0 0 24.577 73.288"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon
          points="0 .96 0 12.679 24.445 37.124 0 61.569 0 73.288 24.577 48.71 24.577 25.538 0 .96"
          fill={BRAND.dark}
          opacity={opacity}
        />
      </svg>
    ),
    "chevron-right": (
      <svg
        width={size * 0.43}
        height={size * 0.864}
        viewBox="0 0 36.208 73.288"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon
          points="36.208 37.124 0 .96 0 25.538 11.587 37.124 0 48.71 0 73.288 36.208 37.124"
          fill={BRAND.dark}
          opacity={opacity}
        />
      </svg>
    ),
    arrow: (
      <svg
        width={size * 0.43}
        height={size * 0.864}
        viewBox="0 0 36.163 72.327"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon
          points="0 0 0 72.327 36.163 36.164 0 0"
          fill={BRAND.light}
          opacity={opacity}
        />
      </svg>
    ),
  };

  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{ animationDelay: delay, animationDuration: duration }}
    >
      {shapes[variant]}
    </div>
  );
}

/* ─── Parallax Shapes Container ─── */
function HeroShapes() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 -z-10 overflow-hidden">
      {/* Large logo - top left, slow float */}
      <FloatingShape
        variant="full"
        size={140}
        opacity={0.06}
        className="animate-float-slow top-[10%] left-[5%]"
        delay="0s"
        duration="25s"
      />
      {/* Chevron right - top right area */}
      <FloatingShape
        variant="chevron-right"
        size={80}
        opacity={0.1}
        className="animate-float-medium top-[15%] right-[10%]"
        delay="2s"
        duration="18s"
      />
      {/* Arrow - mid left */}
      <FloatingShape
        variant="arrow"
        size={60}
        opacity={0.08}
        className="animate-float-reverse top-[45%] left-[8%]"
        delay="4s"
        duration="22s"
      />
      {/* Chevron left - bottom right */}
      <FloatingShape
        variant="chevron-left"
        size={100}
        opacity={0.07}
        className="animate-float-slow top-[60%] right-[6%]"
        delay="1s"
        duration="20s"
      />
      {/* Small full logo - center right */}
      <FloatingShape
        variant="full"
        size={50}
        opacity={0.05}
        className="animate-float-medium top-[30%] right-[25%]"
        delay="3s"
        duration="16s"
      />
      {/* Arrow - bottom left */}
      <FloatingShape
        variant="arrow"
        size={90}
        opacity={0.06}
        className="animate-float-reverse top-[75%] left-[15%]"
        delay="5s"
        duration="24s"
      />
      {/* Tiny chevron right scattered */}
      <FloatingShape
        variant="chevron-right"
        size={40}
        opacity={0.1}
        className="animate-float-slow top-[50%] left-[40%]"
        delay="7s"
        duration="19s"
      />
      {/* Extra shapes for depth */}
      <FloatingShape
        variant="full"
        size={70}
        opacity={0.04}
        className="animate-float-medium top-[80%] right-[30%]"
        delay="6s"
        duration="21s"
      />

      {/* Parallax layer - moves with scroll */}
      <div
        className="absolute inset-0 transition-none"
        style={{ transform: `translateY(${scrollY * 0.15}px)` }}
      >
        <FloatingShape
          variant="chevron-left"
          size={55}
          opacity={0.09}
          className="animate-float-reverse top-[20%] left-[30%]"
          delay="2.5s"
          duration="17s"
        />
        <FloatingShape
          variant="arrow"
          size={45}
          opacity={0.07}
          className="animate-float-slow top-[65%] right-[20%]"
          delay="4.5s"
          duration="23s"
        />
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
        />
      </svg>
    ),
    title: "Deep Regulatory Knowledge",
    description:
      "Covers EU ETS, CSRD, CBAM, Taxonomy Regulation, and more — trained on authoritative legal sources.",
  },
  {
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
        />
      </svg>
    ),
    title: "AI-Powered Answers",
    description:
      "Get instant, contextual responses powered by RAG technology — no more hours of manual research.",
  },
  {
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
    ),
    title: "Source Citations",
    description:
      "Every answer is backed by traceable citations from official EU legal documents and directives.",
  },
  {
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
        />
      </svg>
    ),
    title: "Multi-Session Chat",
    description:
      "Maintain multiple conversation threads with full history — pick up right where you left off.",
  },
  {
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
        />
      </svg>
    ),
    title: "Real-Time Streaming",
    description:
      "Watch answers appear in real time — no waiting for the full response to generate.",
  },
  {
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
    title: "Secure & Private",
    description:
      "Your conversations stay private. No data is shared with third parties or used for training.",
  },
];

const REGULATIONS = [
  {
    abbr: "EU ETS",
    name: "Emissions Trading System",
    color: "from-emerald-500 to-teal-600",
  },
  {
    abbr: "CSRD",
    name: "Corporate Sustainability Reporting",
    color: "from-teal-500 to-cyan-600",
  },
  {
    abbr: "CBAM",
    name: "Carbon Border Adjustment",
    color: "from-cyan-500 to-blue-600",
  },
  {
    abbr: "Taxonomy",
    name: "EU Taxonomy Regulation",
    color: "from-emerald-600 to-green-700",
  },
  {
    abbr: "SFDR",
    name: "Sustainable Finance Disclosure",
    color: "from-green-500 to-emerald-600",
  },
  {
    abbr: "RED III",
    name: "Renewable Energy Directive",
    color: "from-lime-500 to-green-600",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Ask a Question",
    description:
      "Type your question about any EU environmental regulation or policy in plain language.",
  },
  {
    step: "02",
    title: "AI Retrieves Context",
    description:
      "Our RAG system searches authoritative EU legal documents to find the most relevant information.",
  },
  {
    step: "03",
    title: "Get Cited Answers",
    description:
      "Receive a clear, structured answer with inline citations linking back to the original legal sources.",
  },
];

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

/* ─── Animated Hero Logo (pieces slide in left→right) ─── */
function AnimatedHeroLogo() {
  return (
    <div className="relative w-32 h-28 md:w-40 md:h-36 mx-auto">
      {/* Glow backdrop */}
      <div className="absolute inset-0 animate-hero-glow">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-56 md:h-56 bg-emerald-400/20 dark:bg-emerald-500/15 rounded-full blur-3xl" />
      </div>

      <svg
        className="w-full h-full relative z-10"
        viewBox="0 0 84.785 73.288"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Piece 1: Left chevron — enters first, color shifts dark↔light */}
        <polygon
          className="animate-logo-piece-1 animate-color-shift-1"
          points="0 .96 0 12.679 24.445 37.124 0 61.569 0 73.288 24.577 48.71 24.577 25.538 0 .96"
        />
        {/* Piece 2: Center chevron — enters second, color shifts light↔dark */}
        <polygon
          className="animate-logo-piece-2 animate-color-shift-2"
          points="60.741 37.124 24.577 .96 24.577 25.538 36.164 37.124 24.577 48.71 24.577 73.288 60.741 37.124"
        />
        {/* Piece 3: Right arrow — enters last, color shifts dark↔light */}
        <polygon
          className="animate-logo-piece-3 animate-color-shift-3"
          points="48.622 0 48.622 72.327 84.785 36.164 48.622 0"
        />
      </svg>
    </div>
  );
}

/* ─── Section Wrapper ─── */
function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const { ref, inView } = useInView();
  return (
    <section
      id={id}
      ref={ref}
      className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
    >
      {children}
    </section>
  );
}

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
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50 dark:border-gray-800/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Logo className="w-8 h-8 transition-transform group-hover:scale-110" />
          <span className="text-lg font-bold tracking-tight font-brand">
            <span className="text-[#1ba577]">Sustain</span>
            <span className="text-[#9dd3c0]">Nexus</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#1ba577] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/chat"
            className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-[#1ba577] hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30"
          >
            Try It Free
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6 text-gray-600 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 px-6 pb-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#1ba577]"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/chat"
            className="mt-2 block text-center px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-[#1ba577] hover:bg-emerald-600 transition-all"
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
    <div className="min-h-screen bg-white dark:bg-gray-950 font-display overflow-x-hidden">
      <Navbar />

      {/* ── Hero ── */}
      <div className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-emerald-100/60 via-transparent to-transparent dark:from-emerald-900/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-bl from-teal-100/40 to-transparent dark:from-teal-900/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-100/40 to-transparent dark:from-emerald-900/10 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98108_1px,transparent_1px),linear-gradient(to_bottom,#10b98108_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        {/* Floating logo shapes */}
        <HeroShapes />

        <div className="max-w-4xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 mb-8 animate-fade-in-up-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide uppercase">
              AI-Powered Legal Research
            </span>
          </div>

          {/* Animated Hero Logo - pieces slide in left to right */}
          <div className="mb-8">
            <AnimatedHeroLogo />
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-fade-in-up-3">
            <span className="text-gray-900 dark:text-white">Navigate </span>
            <span className="bg-gradient-to-r from-[#1ba577] to-[#9dd3c0] bg-clip-text text-transparent">
              EU ESG Law, Policy
            </span>
            <br />
            <span className="text-gray-900 dark:text-white">
              &amp; Standards with AI
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm md:text-base text-emerald-700 dark:text-emerald-400 font-semibold tracking-wide uppercase mb-4 animate-fade-in-up-3">
            ESG Regulatory Intelligence &amp; Sustainability Strategy Platform
          </p>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up-4">
            Ask complex regulatory questions in plain language. Get instant,
            cited answers from authoritative EU sources—turning compliance risk
            into business opportunity.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up-5">
            <Link
              href="/chat"
              className="group px-8 py-3.5 rounded-full text-base font-semibold text-white bg-[#1ba577] hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
            >
              Start Asking Questions
              <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">
                &rarr;
              </span>
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-3.5 rounded-full text-base font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:text-[#1ba577] transition-all hover:-translate-y-0.5"
            >
              See How It Works
            </a>
          </div>

          {/* Integrated Sustainability Platforms */}
          <div className="mt-16 md:mt-20 max-w-4xl mx-auto animate-fade-in-up-6">
            <p className="text-sm font-semibold text-[#1ba577] tracking-wide uppercase mb-6 text-center">
              Integrated Sustainability Platforms
            </p>
            <div className="grid sm:grid-cols-3 gap-5">
              {/* Carbon Account & Management */}
              <div className="group flex flex-col items-center p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center mb-4 group-hover:border-emerald-400 transition-colors">
                  <svg
                    className="w-8 h-8 text-gray-700 dark:text-gray-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <text
                      x="3"
                      y="11"
                      fontSize="7"
                      fontWeight="700"
                      fill="currentColor"
                      stroke="none"
                      fontFamily="sans-serif"
                    >
                      CO
                    </text>
                    <text
                      x="14"
                      y="14"
                      fontSize="5"
                      fontWeight="700"
                      fill="currentColor"
                      stroke="none"
                      fontFamily="sans-serif"
                    >
                      2
                    </text>
                    <path d="M4 18 Q8 14 12 16 Q16 18 20 15" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 text-center">
                  Carbon Account &amp; Management
                </h3>
                <a
                  href="#"
                  className="mt-2 text-sm font-medium text-[#1ba577] hover:text-emerald-600 transition-colors flex items-center gap-1"
                >
                  Measure &amp; Reduce Carbon Emissions
                  <span>&rarr;</span>
                </a>
              </div>

              {/* ESG Data Management */}
              <div className="group flex flex-col items-center p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center mb-4 group-hover:border-emerald-400 transition-colors">
                  <svg
                    className="w-8 h-8 text-gray-700 dark:text-gray-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="4"
                      y="14"
                      width="3"
                      height="6"
                      rx="0.5"
                      fill="currentColor"
                      opacity="0.3"
                    />
                    <rect
                      x="9"
                      y="10"
                      width="3"
                      height="10"
                      rx="0.5"
                      fill="currentColor"
                      opacity="0.5"
                    />
                    <rect
                      x="14"
                      y="6"
                      width="3"
                      height="14"
                      rx="0.5"
                      fill="currentColor"
                      opacity="0.7"
                    />
                    <rect
                      x="19"
                      y="3"
                      width="3"
                      height="17"
                      rx="0.5"
                      fill="currentColor"
                      opacity="0.9"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 text-center">
                  ESG Data Management
                </h3>
                <a
                  href="#"
                  className="mt-2 text-sm font-medium text-[#1ba577] hover:text-emerald-600 transition-colors flex items-center gap-1"
                >
                  Streamline ESG Reporting
                  <span>&rarr;</span>
                </a>
              </div>

              {/* Product Lifecycle Assessment */}
              <div className="group flex flex-col items-center p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center mb-4 group-hover:border-emerald-400 transition-colors">
                  <svg
                    className="w-8 h-8 text-gray-700 dark:text-gray-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a10 10 0 0 1 0 20" />
                    <path d="M12 22a10 10 0 0 1 0-20" strokeDasharray="4 2" />
                    <path d="M16 8l2-2m0 0l-1-1m1 1l1-1" />
                    <path d="M8 16l-2 2m0 0l1 1m-1-1l-1 1" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 text-center">
                  Product Lifecycle Assessment
                </h3>
                <a
                  href="#"
                  className="mt-2 text-sm font-medium text-[#1ba577] hover:text-emerald-600 transition-colors flex items-center gap-1"
                >
                  Evaluate Environmental Impact
                  <span>&rarr;</span>
                </a>
              </div>
            </div>
          </div>

          {/* Hero mock */}
          <div className="mt-16 md:mt-20 max-w-3xl mx-auto">
            <div className="relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl shadow-gray-200/50 dark:shadow-black/30 overflow-hidden">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="ml-2 text-xs text-gray-400 font-medium font-brand">
                  SustainNexus
                </span>
              </div>
              {/* Chat preview */}
              <div className="p-6 space-y-4 text-left">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="px-4 py-2.5 rounded-2xl rounded-br-md bg-[#1ba577] text-white text-sm max-w-[80%]">
                    What are the key reporting requirements under the CSRD?
                  </div>
                </div>
                {/* AI response */}
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-gray-100 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 max-w-[90%] space-y-2">
                    <p>
                      The{" "}
                      <strong>
                        Corporate Sustainability Reporting Directive (CSRD)
                      </strong>{" "}
                      requires companies to report on:
                    </p>
                    <ul className="list-disc ml-5 space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Environmental impact and climate targets</li>
                      <li>Social and governance factors</li>
                      <li>Due diligence processes</li>
                    </ul>
                    <div className="flex gap-1 mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        [1] Directive 2022/2464
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        [2] ESRS Standards
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Glow underneath */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-2xl" />
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <Section
        id="features"
        className="py-24 md:py-32 bg-gray-50/50 dark:bg-gray-900/30"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-[#1ba577] tracking-wide uppercase mb-3">
              Capabilities
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need for Legal Research
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Purpose-built for environmental law professionals who need
              accurate, sourced answers fast.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-[#1ba577] mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Regulations Covered ── */}
      <Section id="regulations" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-[#1ba577] tracking-wide uppercase mb-3">
              Coverage
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              EU Regulations We Cover
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Our knowledge base covers the most critical EU environmental
              regulations and directives.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {REGULATIONS.map((reg) => (
              <div
                key={reg.abbr}
                className="group relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-transparent transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                {/* Hover gradient overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${reg.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />
                <div className="relative z-10">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-white transition-colors mb-1">
                    {reg.abbr}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-white/80 transition-colors">
                    {reg.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── How It Works ── */}
      <Section
        id="how-it-works"
        className="py-24 md:py-32 bg-gray-50/50 dark:bg-gray-900/30"
      >
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-[#1ba577] tracking-wide uppercase mb-3">
              Process
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Three simple steps from question to cited answer.
            </p>
          </div>

          <div className="space-y-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex gap-6 items-start group">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1ba577] to-[#9dd3c0] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                  {s.step}
                </div>
                <div className="pt-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {s.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CTA ── */}
      <Section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1ba577] to-teal-600 p-12 md:p-16">
            {/* Pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            {/* Floating logo shapes in CTA */}
            <FloatingShape
              variant="arrow"
              size={50}
              opacity={0.15}
              className="animate-float-slow top-[10%] left-[5%]"
              delay="0s"
              duration="18s"
            />
            <FloatingShape
              variant="chevron-right"
              size={35}
              opacity={0.12}
              className="animate-float-medium top-[70%] right-[8%]"
              delay="3s"
              duration="15s"
            />
            <FloatingShape
              variant="chevron-left"
              size={40}
              opacity={0.1}
              className="animate-float-reverse bottom-[15%] left-[20%]"
              delay="1.5s"
              duration="20s"
            />

            <div className="relative z-10">
              <Logo className="w-14 h-14 mx-auto mb-6 brightness-0 invert opacity-80" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Simplify Your Legal Research?
              </h2>
              <p className="text-emerald-100 max-w-lg mx-auto mb-8 leading-relaxed">
                Stop spending hours searching through EU regulations. Get
                accurate, cited answers in seconds.
              </p>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-base font-semibold bg-white text-[#1ba577] hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Get Started for Free
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Footer ── */}
      <footer className="py-12 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <Logo className="w-7 h-7" />
              <span className="text-sm font-bold font-brand">
                <span className="text-[#1ba577]">Sustain</span>
                <span className="text-[#9dd3c0]">Nexus</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              &copy; {new Date().getFullYear()} SustainNexus. ESG Regulatory
              Intelligence &amp; Sustainability Strategy Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
