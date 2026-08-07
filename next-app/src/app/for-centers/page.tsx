"use client";

// Pricing for therapy centers — full white-label branding on every
// exported schedule. Payment is a Razorpay Payment Link (same manual
// activation pattern as individual plans): center pays, messages you,
// you mark them Paid in Admin → Therapy Centers.
import Link from "next/link";
import { TopNav } from "@/components/layout/TopNav";

// TODO: replace with the real Razorpay Payment Link once created.
const PAY_LINK = "https://rzp.io/rzp/NMMLpuLl";

export default function ForCentersPage() {
  return (
    <div className="h-full flex flex-col bg-bg">
      <TopNav />
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-[640px] mx-auto px-5 py-10">
          <p className="text-[13px] text-weekly-accent font-sans font-semibold uppercase tracking-wide mb-2">
            For therapy centers
          </p>
          <h1 className="font-serif text-[30px] text-ink mb-3">
            Your center's own branded schedules
          </h1>
          <p className="text-[14px] text-ink-2 leading-relaxed mb-8">
            Give every family you work with schedules that carry <strong>your</strong> logo
            and name — not ours. Full white-label: no Visual Schedules attribution,
            no QR code, just your center on every page they print.
          </p>

          <div className="bg-white border-2 border-weekly-accent rounded-lg p-6 mb-8">
            <div className="inline-block text-[11px] font-sans font-bold uppercase tracking-wide bg-[#EAF5EA] text-[#2D6A2D] px-2.5 py-1 rounded-full mb-3">
              Launch offer — 50% off your first year
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-serif text-[42px] text-ink">₹999</span>
              <span className="text-[15px] text-ink-3">/ month</span>
            </div>
            <p className="text-[13px] text-ink-3 mb-1">
              Billed for your first 12 months. Regular price ₹1,999/month after.
            </p>
            <p className="text-[12px] text-ink-3 italic mb-5">
              (Regular price: ₹1,999/month)
            </p>

            <ul className="space-y-2 mb-6">
              {[
                "Your logo and center name on every exported schedule",
                "No Visual Schedules branding, no QR code — fully white-label",
                "A shareable access code for every family you work with",
                "Usage tracking — see how many families are using your code",
                "All paid card categories unlocked for every linked family",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2 text-[13px] text-ink-2">
                  <span className="text-weekly-accent font-bold shrink-0">✓</span>
                  {line}
                </li>
              ))}
            </ul>

            <a
              href={PAY_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3 bg-accent-strong text-white rounded font-sans text-[14px] font-semibold no-underline hover:opacity-90 transition-opacity"
            >
              Get started — ₹999/month
            </a>
          </div>

          <div className="bg-[#F8F7F4] border border-border rounded p-4">
            <p className="text-[13px] text-ink-2 leading-relaxed">
              <strong>After payment:</strong> message us on{" "}
              <a href="https://wa.me/919529723925" className="text-weekly-accent underline">WhatsApp</a>{" "}
              or email{" "}
              <a href="mailto:growgentlyofficial@gmail.com" className="text-weekly-accent underline">
                growgently.co@gmail.com
              </a>{" "}
              with your center's name and logo — we'll activate full white-label
              branding within a few hours.
            </p>
          </div>

          <p className="text-[12px] text-ink-3 mt-6 text-center">
            Already have a free access code from us?{" "}
            <Link href="/login" className="text-weekly-accent underline">Sign in</Link> to keep using it —
            this plan simply removes our branding from your families' printed schedules.
          </p>
        </div>
      </main>
    </div>
  );
}
