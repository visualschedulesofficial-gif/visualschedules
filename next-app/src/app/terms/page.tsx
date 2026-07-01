import Link from "next/link";

export default function TermsPage() {
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
        <h1 className="font-serif text-3xl italic text-ink mb-2">Terms of Service</h1>
        <p className="text-[12px] text-ink-3 mb-8">Last updated: July 2026 · Visual Schedules by Grow Gently</p>

        <div className="space-y-7 text-[14px] text-ink-2 leading-relaxed">
          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Who these terms apply to</h2>
            <p>These terms apply to anyone who uses Visual Schedules, a service by Grow Gently (the "Service"). By signing in or subscribing, you agree to these terms. If you use the Service without signing in, you agree to these terms for your free-tier use.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">What the Service does</h2>
            <p>Visual Schedules lets you create, save, and export picture-based visual schedules. A free tier (Daily category) is available to all users. Paid subscriptions unlock additional card categories for a fixed time period.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Subscriptions and payments</h2>
            <ul className="space-y-2 ml-4">
              <li>Subscriptions are fixed-term (3, 6, or 12 months) with <strong className="text-ink">no automatic renewal</strong>. You will not be charged again unless you choose to subscribe again.</li>
              <li>Payments are processed by Razorpay. We accept UPI, debit cards, and credit cards.</li>
              <li>Prices are listed in Indian Rupees (₹) and are inclusive of any applicable taxes.</li>
              <li>When your subscription expires, your account returns to free-tier access. Your saved schedules remain accessible; paid-category cards in those schedules will still display but you cannot add new paid-category cards.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Your account</h2>
            <ul className="space-y-2 ml-4">
              <li>You are responsible for keeping your email address accurate so you can receive login codes.</li>
              <li>You must not share your account or attempt to share subscription access with others.</li>
              <li>You must be at least 18 years old to create an account. If you are under 18, a parent or guardian must agree to these terms on your behalf.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Your content</h2>
            <p>The schedules you create belong to you. By saving them to the Service, you grant us a limited licence to store and display them to you through the Service. We do not claim ownership of your schedules and will not use them for any other purpose.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Acceptable use</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="space-y-1.5 ml-4">
              <li>Use the Service for any unlawful purpose.</li>
              <li>Attempt to reverse-engineer, scrape, or copy card content or images for redistribution.</li>
              <li>Circumvent subscription access controls.</li>
              <li>Upload harmful, offensive, or illegal content.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Our card content</h2>
            <p>The visual card images and illustrations provided through the Service are owned by or licensed to Grow Gently. You may use them within the app to create schedules for personal, educational, or therapeutic use. You may not redistribute the images separately or use them in other products.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Availability</h2>
            <p>We aim to keep the Service running reliably, but we cannot guarantee uninterrupted availability. We are a small team and may need to take the Service offline for maintenance. We will not be liable for disruptions beyond our control.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Limitation of liability</h2>
            <p>The Service is provided "as is." To the maximum extent permitted by applicable law, Grow Gently is not liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability to you for any claim is limited to the amount you paid us in the 3 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Termination</h2>
            <p>You can stop using the Service at any time and request account deletion by emailing us. We may suspend or terminate accounts that violate these terms. If we terminate your account without cause, we will refund any remaining paid subscription period on a pro-rata basis.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Governing law</h2>
            <p>These terms are governed by the laws of India. Any disputes will be subject to the jurisdiction of courts in Pune, Maharashtra.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg italic text-ink mb-2">Contact</h2>
            <p>Questions about these terms? Write to us at <a href="mailto:growgently.co@gmail.com" className="text-ink underline">growgently.co@gmail.com</a>.</p>
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
