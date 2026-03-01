"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";

const navLinks = [
  { href: "/tree", label: "Family Tree" },
  { href: "/stories", label: "Stories" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌳</span>
            <span className="font-serif text-xl font-semibold text-stone-800">
              MyAncestors
            </span>
          </Link>

          {/* Nav links (authenticated) */}
          <SignedIn>
            <div className="hidden sm:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    pathname.startsWith(link.href)
                      ? "text-stone-900"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <SignedOut>
            <Link
              href="/sign-in"
              className="text-sm font-medium text-stone-600 hover:text-stone-900"
            >
              Sign in
            </Link>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
}
