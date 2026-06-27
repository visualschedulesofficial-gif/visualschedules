"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`/api/auth/verify?token=${token}`);
        if (res.ok) {
          setStatus("success");
          setTimeout(() => {
            window.location.href = "/schedules";
          }, 1500);
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    }
    verify();
  }, [token]);

  return (
    <div className="bg-surface w-full max-w-sm p-7 border border-border text-center">
      {status === "verifying" && (
        <>
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-border border-t-accent rounded-full animate-spin" />
          <h1 className="text-sm font-medium text-ink mb-1">Signing you in...</h1>
          <p className="text-xs text-ink-2">Verifying your magic link</p>
        </>
      )}
      {status === "success" && (
        <>
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-badge-free-bg flex items-center justify-center">
            <svg className="w-5 h-5 stroke-green stroke-2 fill-none" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-sm font-medium text-ink mb-1">You&apos;re in!</h1>
          <p className="text-xs text-ink-2">Redirecting to your schedules...</p>
        </>
      )}
      {status === "error" && (
        <>
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#FEF0F0] flex items-center justify-center">
            <svg className="w-5 h-5 stroke-[#C53030] stroke-2 fill-none" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h1 className="text-sm font-medium text-ink mb-1">Link expired or invalid</h1>
          <p className="text-xs text-ink-2 mb-4">
            Magic links expire after 15 minutes. Please request a new one.
          </p>
          <Link
            href="/login"
            className="text-[11px] tracking-wider uppercase px-6 py-2.5 bg-ink text-white border border-ink no-underline font-medium font-sans hover:bg-[#333] transition-all inline-block"
          >
            Try Again
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <nav className="h-[66px] bg-surface border-b border-border flex items-center px-7 shrink-0 max-md:px-4 max-md:h-[56px]">
        <Link
          href="/"
          className="font-serif text-2xl italic text-ink no-underline leading-none max-[480px]:text-base"
        >
          Visual Schedules
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <Suspense
          fallback={
            <div className="bg-surface w-full max-w-sm p-7 border border-border text-center">
              <div className="w-8 h-8 mx-auto mb-4 border-2 border-border border-t-accent rounded-full animate-spin" />
              <p className="text-xs text-ink-2">Loading...</p>
            </div>
          }
        >
          <VerifyContent />
        </Suspense>
      </main>
    </div>
  );
}
