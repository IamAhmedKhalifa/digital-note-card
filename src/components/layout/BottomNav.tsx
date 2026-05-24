"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Search, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/library", label: "Library", Icon: BookOpen },
  { href: "/search", label: "Search", Icon: Search },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-nc-warm/95 backdrop-blur-md border-t border-nc-grey z-40 safe-bottom">
      <div className="flex items-stretch max-w-2xl mx-auto">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active =
            href === "/library"
              ? pathname === "/library" || pathname.startsWith("/books") || pathname.startsWith("/cards")
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`
                flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2
                transition-colors duration-150
                ${active ? "text-nc-green" : "text-nc-charcoal/40 hover:text-nc-charcoal/70"}
              `}
            >
              <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
              <span className={`text-xs ${active ? "font-semibold" : "font-normal"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
