"use client";

import { useState } from "react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    appName: "Visual Schedules",
    instagram: "@visual_schedule_official",
    siteUrl: "visualschedule.app",
    contactEmail: "visualschedulesofficial@gmail.com",
  });

  const [toggles, setToggles] = useState({
    autoAddPage: true,
    showLockIcon: true,
    showUnlockModal: true,
    showFooter: true,
  });

  return (
    <>
      <div className="h-[52px] bg-card border-b border-border flex items-center px-6 shrink-0">
        <span className="text-sm text-ink">App Settings</span>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-5">
          {/* App settings */}
          <div className="bg-card border border-border">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-[13px] text-ink">App settings</h3>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <label className="text-[11px] tracking-widest uppercase text-ink-3 block mb-1 font-medium">App name</label>
                <input value={settings.appName} onChange={(e) => setSettings({ ...settings, appName: e.target.value })} className="w-full py-1.5 px-2.5 border border-border bg-white font-sans text-[13px] text-ink outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-[11px] tracking-widest uppercase text-ink-3 block mb-1 font-medium">Instagram handle</label>
                <input value={settings.instagram} onChange={(e) => setSettings({ ...settings, instagram: e.target.value })} className="w-full py-1.5 px-2.5 border border-border bg-white font-sans text-[13px] text-ink outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-[11px] tracking-widest uppercase text-ink-3 block mb-1 font-medium">Site URL</label>
                <input value={settings.siteUrl} onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })} className="w-full py-1.5 px-2.5 border border-border bg-white font-sans text-[13px] text-ink outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-[11px] tracking-widest uppercase text-ink-3 block mb-1 font-medium">Contact email</label>
                <input value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} className="w-full py-1.5 px-2.5 border border-border bg-white font-sans text-[13px] text-ink outline-none focus:border-accent" />
              </div>
              <button className="text-[11px] tracking-wider uppercase px-3 py-1.5 bg-ink text-white border border-ink font-sans font-medium hover:bg-[#333] w-fit mt-1">
                Save settings
              </button>
            </div>
          </div>

          {/* Feature toggles */}
          <div className="bg-card border border-border">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-[13px] text-ink">Feature toggles</h3>
            </div>
            <div className="p-4">
              {[
                { key: "autoAddPage", label: "Auto-add next page when full" },
                { key: "showLockIcon", label: "Show lock icon on paid cards" },
                { key: "showUnlockModal", label: "Show unlock modal on locked click" },
                { key: "showFooter", label: "Show footer on A4 print" },
              ].map((item) => (
                <div key={item.key} className="flex justify-between items-center py-2.5 border-b border-border last:border-b-0">
                  <span className="text-xs text-ink-2">{item.label}</span>
                  <button
                    onClick={() => setToggles({ ...toggles, [item.key]: !toggles[item.key as keyof typeof toggles] })}
                    className={`w-9 h-5 rounded-full relative transition-colors ${toggles[item.key as keyof typeof toggles] ? "bg-accent" : "bg-border"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${toggles[item.key as keyof typeof toggles] ? "left-[18px]" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
