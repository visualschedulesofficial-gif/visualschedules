import Link from "next/link";

export default function PrivacyPage() {
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
        <h1 className="font-serif text-3xl italic text-ink mb-2">Privacy Policy</h1>
        <p className="text-[12px] text-ink-3 mb-8">Last updated: July 2026 · Visual Schedules by Grow Gently</p>

        <div className="space-y-7 text-[14px] text-ink-2 leading-relaxed">
          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Who we are</h2>
            <p>Visual Schedules is a product by Grow Gently, an educational design brand based in India. We make tools for children who learn differently and the families, educators, and therapists who support them. You can reach us at <a href="mailto:growgently.co@gmail.com" className="text-ink underline">growgently.co@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">What we collect and why</h2>
            <p className="mb-3">We collect only what we need to run the service:</p>
            <ul className="space-y-2 ml-4">
              <li><strong className="text-ink">Email address</strong> — when you sign in. Used to identify your account, send your one-time login code, and (if you subscribe) manage your subscription. We do not use your email for marketing without your explicit consent.</li>
              <li><strong className="text-ink">Schedules you create</strong> — saved against your account so you can access them across devices. Schedule content (cards, layout, titles) is stored in our database.</li>
              <li><strong className="text-ink">Subscription records</strong> — if you purchase a plan, we store the plan type and expiry date. Payment is handled by Razorpay; we never see or store card or UPI details.</li>
              <li><strong className="text-ink">Basic usage logs</strong> — standard server logs for security and debugging (IP address, timestamps). Not used for tracking or profiling.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">What we do not do</h2>
            <ul className="space-y-1.5 ml-4">
              <li>We do not sell your data to anyone.</li>
              <li>We do not show you ads or let advertisers access your information.</li>
              <li>We do not track you across other websites.</li>
              <li>We do not collect information about the children whose schedules you create. No child data is stored.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Free use (no account)</h2>
            <p>You can build and export schedules without signing in. In this case, we collect nothing beyond standard server logs. Your schedule is not saved between sessions.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Data storage and security</h2>
            <p>Your data is stored on Cloudflare's infrastructure (D1 database and R2 storage), which is hosted globally but processed under EU data protection standards. We use secure, encrypted connections (HTTPS) for all data transfer. Sessions are managed with secure, HTTP-only cookies that expire after 30 days.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Third-party services</h2>
            <ul className="space-y-1.5 ml-4">
              <li><strong className="text-ink">Razorpay</strong> — processes subscription payments. Razorpay's own privacy policy applies to payment data.</li>
              <li><strong className="text-ink">Resend</strong> — delivers OTP login emails. Your email address is passed to Resend solely to send the login code.</li>
              <li><strong className="text-ink">Cloudflare</strong> — hosts the application and stores your data.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Your rights</h2>
            <p>You can request a copy of your data, ask us to correct it, or ask us to delete your account and all associated data at any time. Email us at <a href="mailto:growgently.co@gmail.com" className="text-ink underline">growgently.co@gmail.com</a> and we'll respond within 7 working days.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Children's privacy</h2>
            <p>Visual Schedules is used <em>by</em> parents, educators, and therapists to create resources <em>for</em> children. We do not knowingly collect personal information from children. The app is not intended for direct use by children under 13.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Changes to this policy</h2>
            <p>If we make significant changes, we'll update the date at the top of this page. Continued use of the app after a change means you accept the updated policy.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Contact</h2>
            <p>Questions or concerns? Write to us at <a href="mailto:growgently.co@gmail.com" className="text-ink underline">growgently.co@gmail.com</a>. We're a small team and we read every message.</p>
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
