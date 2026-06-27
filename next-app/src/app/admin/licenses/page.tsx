"use client";

import { useState } from "react";

export default function AdminLicensesPage() {
  const [allPermalink, setAllPermalink] = useState("growgently-all");
  const [singlePermalink, setSinglePermalink] = useState("growgently-single");

  // TODO: Fetch from D1 subscriptions table
  const licenses = [
    { key: "A3F2-9XK1-BMNQ-7TZ4", email: "parent@example.com", type: "All categories", amount: "₹499", date: "Today" },
    { key: "B7M3-2LKP-XRQT-9WN5", email: "slp@clinic.in", type: "Therapy", amount: "₹199", date: "Today" },
  ];

  return (
    <>
      <div className="h-[52px] bg-card border-b border-border flex items-center px-6 shrink-0">
        <span className="text-sm text-ink">License Keys</span>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {/* Gumroad product config */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-card border border-border">
            <div className="px-4 py-3 border-b border-border flex justify-between items-center">
              <h3 className="text-[13px] text-ink">All Categories product</h3>
              <span className="text-[11px] text-green">₹499</span>
            </div>
            <div className="p-4">
              <label className="text-[11px] tracking-widest uppercase text-ink-3 block mb-1.5 font-medium">Gumroad permalink</label>
              <input
                value={allPermalink}
                onChange={(e) => setAllPermalink(e.target.value)}
                className="w-full py-1.5 px-2.5 border border-border bg-white font-sans text-[13px] text-ink outline-none focus:border-accent mb-2"
              />
              <p className="text-[11px] text-ink-3 mb-3">Found at gumroad.com/l/<strong>{allPermalink}</strong></p>
              <button className="text-[11px] tracking-wider uppercase px-3 py-1.5 bg-ink text-white border border-ink font-sans font-medium hover:bg-[#333]">
                Save
              </button>
            </div>
          </div>
          <div className="bg-card border border-border">
            <div className="px-4 py-3 border-b border-border flex justify-between items-center">
              <h3 className="text-[13px] text-ink">Single Category product</h3>
              <span className="text-[11px] text-accent">₹199</span>
            </div>
            <div className="p-4">
              <label className="text-[11px] tracking-widest uppercase text-ink-3 block mb-1.5 font-medium">Gumroad permalink</label>
              <input
                value={singlePermalink}
                onChange={(e) => setSinglePermalink(e.target.value)}
                className="w-full py-1.5 px-2.5 border border-border bg-white font-sans text-[13px] text-ink outline-none focus:border-accent mb-2"
              />
              <p className="text-[11px] text-ink-3 mb-3">Found at gumroad.com/l/<strong>{singlePermalink}</strong></p>
              <button className="text-[11px] tracking-wider uppercase px-3 py-1.5 bg-ink text-white border border-ink font-sans font-medium hover:bg-[#333]">
                Save
              </button>
            </div>
          </div>
        </div>

        {/* License key table */}
        <div className="flex gap-3 mb-4">
          <input placeholder="Search by key or email…" className="flex-1 py-1.5 px-2.5 border border-border bg-white font-sans text-xs text-ink outline-none focus:border-accent" />
          <select className="py-1.5 px-2.5 border border-border bg-white font-sans text-xs text-ink-2 outline-none">
            <option>All</option>
            <option>All categories</option>
            <option>Single category</option>
          </select>
        </div>

        <div className="bg-card border border-border overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-surface-hover text-[10px] tracking-wider uppercase text-ink-3">
                <th className="text-left px-4 py-2 font-medium">Key</th>
                <th className="text-left px-4 py-2 font-medium">Email</th>
                <th className="text-left px-4 py-2 font-medium">Type</th>
                <th className="text-left px-4 py-2 font-medium">Amount</th>
                <th className="text-left px-4 py-2 font-medium">Date</th>
                <th className="text-left px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((lic, i) => (
                <tr key={i} className="border-b border-border last:border-b-0 hover:bg-surface-hover">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-ink">{lic.key}</td>
                  <td className="px-4 py-2.5 text-ink">{lic.email}</td>
                  <td className="px-4 py-2.5 text-ink-3">{lic.type}</td>
                  <td className="px-4 py-2.5 text-ink">{lic.amount}</td>
                  <td className="px-4 py-2.5 text-ink-3">{lic.date}</td>
                  <td className="px-4 py-2.5">
                    <button className="text-[11px] text-[#B83232] hover:underline">Revoke</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
