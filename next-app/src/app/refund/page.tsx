import Link from "next/link";

export default function RefundPage() {
  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <nav className="h-[56px] md:h-[66px] bg-surface border-b border-border flex items-center justify-between px-4 md:px-7 shrink-0">
        <Link href="/schedule" className="font-serif text-base md:text-2xl italic text-ink no-underline leading-none">
          Visual Schedules
        </Link>
        <Link href="/login" className="text-[11px] tracking-wider uppercase px-4 py-[0.42rem] border border-border text-[#4A4540] no-underline font-medium font-sans hover:border-ink hover:text-ink transition-all">
          Sign In
        </Link>
      </nav>

      <main className="flex-1 px-4 py-12 max-w-2xl mx-auto w-full">
        <h1 className="font-serif text-3xl italic text-ink mb-2">Refund & Cancellation Policy</h1>
        <p className="text-[12px] text-ink-3 mb-8">Last updated: July 2026 · Visual Schedules by Grow Gently</p>

        <div className="space-y-7 text-[14px] text-ink-2 leading-relaxed">
          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">No auto-renewal</h2>
            <p>All Visual Schedules subscription plans (3 months, 6 months, 12 months) are fixed-term, one-time payments. There is no automatic renewal and you will never be charged again unless you choose to subscribe again. There is nothing to "cancel."</p>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Refund window</h2>
            <p>If you are not satisfied with your subscription, you may request a full refund within <strong className="text-ink">7 days of purchase</strong>. To request a refund, email us at <a href="mailto:growgently.co@gmail.com" className="text-ink underline">growgently.co@gmail.com</a> with your registered email address and the date of purchase. We'll process the refund within 5–7 working days.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">After the refund window</h2>
            <p>After 7 days, we do not offer refunds for the remaining unused period of a subscription. However, if you have experienced a technical issue that prevented you from using the Service, please contact us and we will review it on a case-by-case basis.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Accidental purchases</h2>
            <p>If you accidentally purchased the wrong plan (e.g. 3 months instead of 12 months), contact us within 7 days and we'll help you switch. We'll refund the original purchase and you can repurchase the correct plan.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Failed payments</h2>
            <p>If your payment failed and you were still charged, contact us immediately with the transaction reference from your bank or UPI app. We'll investigate with Razorpay and arrange a refund if a duplicate or failed charge is confirmed.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Free tier</h2>
            <p>The free tier (Daily category) is always available without payment. There is nothing to refund for free use.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">How to contact us</h2>
            <p>Email: <a href="mailto:growgently.co@gmail.com" className="text-ink underline">growgently.co@gmail.com</a></p>
            <p className="mt-1">We're a small team and aim to respond within 2 working days. Please include your registered email and purchase date in your message so we can look up your order quickly.</p>
          </section>
        </div>
      </main>

      <footer className="bg-ink text-[#9A9690] px-7 py-4 flex items-center justify-between gap-4 flex-wrap text-xs max-md:px-4">
        <span className="font-serif text-base italic text-[#F5F2EC]">Grow Gently</span>
        <div className="flex items-center gap-4 flex-wrap">
          <Link href="/privacy" className="text-[#9A9690] no-underline hover:text-[#F5F2EC]">Privacy</Link>
          <Link href="/terms" className="text-[#9A9690] no-underline hover:text-[#F5F2EC]">Terms</Link>
          <Link href="/refund" className="text-[#9A9690] no-underline hover:text-[#F5F2EC]">Refunds</Link>
        </div>
      </footer>
    </div>
  );
}
