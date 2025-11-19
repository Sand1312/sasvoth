"use client";
import { useEffect, useRef, useState } from "react";
import Image, { type ImageProps } from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@sasvoth/ui/button";

type NavItem = {
  label: string;
  href: string;
};

type RootNavClientProps = {
  user: any;
  navItems: NavItem[];
  hideOnRoutes: string[];
  wrapperClasses: string;
  logoProps: Pick<ImageProps, "src" | "alt" | "width" | "height" | "className">;
};

export function RootNavClient({
  user,
  navItems,
  hideOnRoutes,
  wrapperClasses,
  logoProps,
}: RootNavClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isLoggedIn = !!user;
  const shouldHideNav = hideOnRoutes.some((route) =>
    pathname?.startsWith(route)
  );

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      closeMenu();
      router.replace("/signin");
      router.refresh();
    }
  };

  if (shouldHideNav) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <nav className={wrapperClasses}>
        <Link href="/" className="flex items-center">
          <Image {...logoProps} priority />
          <span className="sr-only">SaSvoth</span>
        </Link>

        <div className="flex items-center gap-6 text-lg font-semibold text-gray-900">
          <Link href="/signup">
            <Button className="h-11 rounded-full bg-gray-200 px-8 text-base font-semibold text-gray-900 shadow-none hover:bg-gray-300">
              Sign up
            </Button>
          </Link>
          <Link
            href="/signin"
            className="text-lg font-semibold text-gray-900 hover:text-gray-600"
          >
            Login
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className={wrapperClasses}>
      <div className="flex items-center gap-10">
        <Link href="/" className="flex items-center">
          <Image {...logoProps} />
          <span className="sr-only">SaSvoth</span>
        </Link>
        <div className="flex items-center text-base font-medium text-gray-500">
          {navItems.map((item, idx) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const showDivider = idx < navItems.length - 1;
            return (
              <div className="flex items-center" key={item.href}>
                <Link
                  href={item.href}
                  className={`transition-colors ${
                    isActive
                      ? "font-semibold text-gray-900 underline decoration-2 underline-offset-4"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {item.label}
                </Link>
                {showDivider ? (
                  <span className="mx-4 text-gray-300">/</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/settings"></Link>
        <div className="relative" ref={menuRef}>
          <Button
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 transition-colors hover:bg-gray-300"
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <span className="sr-only">Open user menu</span>
          </Button>
          {isMenuOpen ? (
            <div className="absolute right-0 mt-3 w-40 rounded-md border border-gray-200 bg-white py-1 text-sm text-gray-700 shadow-lg">
              <Button className="flex w-full items-center px-4 py-2 text-left hover:bg-gray-50">
                Settings
              </Button>
              <Button
                className="flex w-full items-center px-4 py-2 text-left hover:bg-gray-50"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
