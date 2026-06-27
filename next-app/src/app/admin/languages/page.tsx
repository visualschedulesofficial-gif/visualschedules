"use client";

import { useState } from "react";

const ALL_LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिंदी" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "fr", name: "French", native: "Français" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "zh", name: "Chinese", native: "中文" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "ru", name: "Russian", native: "Русский" },
  { code: "ind", name: "Indonesian", native: "Bahasa" },
  { code: "ms", name: "Malay", native: "Melayu" },
  { code: "th", name: "Thai", native: "ไทย" },
  { code: "tl", name: "Filipino", native: "Tagalog" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt" },
];

export default function AdminLanguagesPage() {
  const [enabled, setEnabled] = useState<Set<string>>(
    new Set(ALL_LANGUAGES.map((l) => l.code))
  );

  function toggle(code: string) {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  return (
    <>
      <div className="h-[52px] bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
        <span className="text-sm text-ink">Languages</span>
        <button className="text-[11px] tracking-wider uppercase px-3 py-1.5 bg-ink text-white border border-ink font-sans font-medium hover:bg-[#333]">
          Save Settings
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <p className="text-xs text-ink-3 mb-4">
          Enable languages that have complete translations. Users pick one language per session.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {ALL_LANGUAGES.map((lang) => {
            const isOn = enabled.has(lang.code);
            return (
              <div
                key={lang.code}
                onClick={() => toggle(lang.code)}
                className={`p-4 cursor-pointer transition-colors border ${
                  isOn ? "border-accent bg-[#FEFCF8]" : "border-border bg-card"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[13px] text-ink">{lang.name}</p>
                    <p className="text-xs text-ink-3 italic">{lang.native}</p>
                    <p className={`text-[11px] mt-1 ${isOn ? "text-green" : "text-ink-3"}`}>
                      {isOn ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isOn ? "bg-accent" : "bg-border"}`}>
                    {isOn && (
                      <svg width="8" height="8" stroke="#FFF" strokeWidth="2.5" fill="none" strokeLinecap="round">
                        <polyline points="7 1 3 6 1 4" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
