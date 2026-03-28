"use client";

import { useState, useRef, useEffect } from "react";

interface InvitationModalProps {
  onSuccess: () => void;
  questionsUsed: number;
  questionLimit: number;
}

export default function InvitationModal({
  onSuccess,
  questionsUsed,
  questionLimit,
}: InvitationModalProps) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 30);
    setCode(value);
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isVerifying) return;

    setIsVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (data.valid) {
        onSuccess();
      } else {
        setError("This code is invalid or has already been used. Please try again.");
        inputRef.current?.focus();
      }
    } catch {
      setError("Unable to verify your code. Please check your connection and try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-heading"
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-lg shadow-xl"
        style={{ backgroundColor: "#f8faf8" }}
      >
        {/* Top accent bar */}
        <div className="h-1 rounded-t-lg" style={{ backgroundColor: "#1ba577" }} />

        <div className="px-8 py-8">
          {/* Logo */}
          <svg
            className="w-12 h-12 mx-auto mb-3"
            viewBox="0 0 84.785 73.288"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon points="48.622 0 48.622 72.327 84.785 36.164 48.622 0" fill="#9dd3c0" />
            <polygon
              points="60.741 37.124 24.577 .96 24.577 25.538 36.164 37.124 24.577 48.71 24.577 73.288 60.741 37.124"
              fill="#1ba577"
            />
            <polygon
              points="0 .96 0 12.679 24.445 37.124 0 61.569 0 73.288 24.577 48.71 24.577 25.538 0 .96"
              fill="#1ba577"
            />
          </svg>

          {/* Heading */}
          <h2
            id="modal-heading"
            className="text-center text-xl font-semibold text-stone-800 mb-2"
          >
            You&rsquo;ve used all {questionLimit} free questions
          </h2>

          {/* Explanation */}
          <p className="text-center text-sm text-stone-500 mb-7 leading-relaxed">
            SustainNexus is currently in early access. Enter an invitation code below to
            continue using the platform.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="ENTER CODE"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                className={[
                  "w-full px-4 py-3 rounded-lg border text-lg font-mono tracking-widest text-center",
                  "bg-stone-50 text-stone-800 placeholder:text-stone-300",
                  "focus:outline-none focus:ring-2 focus:ring-[#1ba577]/40 focus:border-[#1ba577]",
                  "transition-colors duration-200 ease-out",
                  error
                    ? "border-red-400 focus:ring-red-300/40 focus:border-red-400"
                    : "border-stone-300",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-describedby={error ? "code-error" : undefined}
                aria-invalid={!!error}
              />

              {error && (
                <p
                  id="code-error"
                  role="alert"
                  className="mt-2 text-sm text-red-600 text-center leading-snug"
                >
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!code.trim() || isVerifying}
              className={[
                "w-full py-3 px-6 rounded-lg font-semibold text-sm tracking-wide",
                "transition-all duration-200 ease-out",
                !code.trim() || isVerifying
                  ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                  : "text-white hover:opacity-90 active:scale-[0.99]",
              ]
                .filter(Boolean)
                .join(" ")}
              style={
                code.trim() && !isVerifying
                  ? { backgroundColor: "#1ba577" }
                  : undefined
              }
            >
              {isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Verifying...
                </span>
              ) : (
                "Unlock Access"
              )}
            </button>
          </form>

          {/* Help text */}
          <p className="mt-6 text-center text-xs text-stone-400 leading-relaxed">
            Don&rsquo;t have a code?{" "}
            <a
              href="mailto:hello@sustainnexus.com"
              className="text-stone-500 underline underline-offset-2 hover:text-[#1ba577] transition-colors duration-200 ease-out"
            >
              Contact us to request access.
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
