"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { group: "Overview", items: [
    { href: "/admin", label: "Dashboard", icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  ]},
  { group: "Content", items: [
    { href: "/admin/cards", label: "Schedule Cards", icon: "M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM3 9h18M9 21V9" },
    { href: "/admin/categories", label: "Categories", icon: "M4 6h16M4 12h10M4 18h14" },
    { href: "/admin/languages", label: "Languages", icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z" },
  ]},
  { group: "Business", items: [
    { href: "/admin/orders", label: "Unlock Orders", icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6" },
    { href: "/admin/licenses", label: "License Keys", icon: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zM15.5 7.5l2-2" },
    { href: "/admin/users", label: "Users", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8" },
    { href: "/admin/analytics", label: "Analytics", icon: "M18 20V10M12 20V4M6 20v-6" },
  ]},
  { group: "Site", items: [
    { href: "/admin/settings", label: "App Settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4" },
  ]},
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="h-dvh overflow-hidden grid grid-cols-[200px_1fr]">
      {/* Dark sidebar */}
      <aside className="bg-ink flex flex-col overflow-y-auto">
        <div className="p-4 pb-3 border-b border-[#2A2825]">
          <Link href="/" className="font-serif text-[0.95rem] italic text-[#F5F2EC] no-underline block">
            Visual Schedules
          </Link>
          <p className="text-[11px] tracking-wider uppercase text-[#555] mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 py-3">
          {navItems.map((group) => (
            <div key={group.group}>
              <p className="text-[11px] tracking-[0.12em] uppercase text-[#444] px-4 py-2 font-normal">
                {group.group}
              </p>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-4 py-2 text-xs no-underline transition-all ${
                      isActive
                        ? "bg-[#252220] text-white"
                        : "text-[#888] hover:bg-[#1E1C1A] hover:text-[#CCC]"
                    }`}
                  >
                    <svg className="w-[13px] h-[13px] stroke-current stroke-[1.8] fill-none shrink-0" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <path d={item.icon} />
                    </svg>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-[#2A2825] flex items-center gap-2">
          <div className="w-[26px] h-[26px] rounded-full bg-accent flex items-center justify-center text-[11px] text-white shrink-0">
            A
          </div>
          <span className="text-xs text-[#888]">Admin</span>
          <Link href="/" className="ml-auto text-[11px] text-[#555] hover:text-[#EE8888] no-underline">
            Exit
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-col overflow-hidden bg-bg">
        {children}
      </main>
    </div>
  );
}
