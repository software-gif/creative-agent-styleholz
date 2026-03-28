"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Board" },
    { href: "/library", label: "Asset Library" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-border px-6 py-3">
      <nav className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-3 mr-4">
          <Image
            src="/logo_dark.png"
            alt="styleholz"
            width={120}
            height={32}
            className="h-7 w-auto"
          />
          <span className="text-xs font-medium text-muted border-l border-border pl-3">
            Creative Board
          </span>
        </Link>

        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-semibold transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted hover:text-accent"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
