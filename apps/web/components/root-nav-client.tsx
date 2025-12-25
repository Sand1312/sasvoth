"use client";
import { useEffect } from "react";
import Image, { type ImageProps } from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@sasvoth/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@sasvoth/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sasvoth/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/types/user";

type NavItem = {
  label: string;
  href: string;
};

type RootNavClientProps = {
  user: User;
  navItems: NavItem[];
  hideOnRoutes: string[];
  wrapperClasses: string;
  logoProps: Pick<ImageProps, "src" | "alt" | "width" | "height" | "className">;
};

export function RootNavClient({
  navItems,
  hideOnRoutes,
  wrapperClasses,
  logoProps,
}: RootNavClientProps) {
  const { user, signout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoggedIn = !!user;

  // Admin Path Detection
  const isAdminPath = pathname?.startsWith("/admin");
  const homeLink = isAdminPath ? "/admin/dashboard" : "/";

  // Login Callback URL
  const loginHref = `/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`;
  const shouldHideNav = hideOnRoutes.some((route) =>
    pathname?.startsWith(route)
  );

  // Dynamic Navigation Items
  const computedNavItems = navItems.map((item) =>
    isAdminPath ? { ...item, href: `/admin${item.href}` } : item
  );

  const handleLogout = async () => {
    await signout();
  };

  if (shouldHideNav) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <nav className={wrapperClasses}>
        <Link href={homeLink} className="flex items-center">
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
            href={loginHref}
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
        <Link href={homeLink} className="flex items-center">
          <Image {...logoProps} />
          <span className="sr-only">SaSvoth</span>
        </Link>
        <div className="flex items-center text-base font-medium text-gray-500">
          {computedNavItems.map((item, idx) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const showDivider = idx < computedNavItems.length - 1;
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatar} alt={user?.name || "User"} />
                <AvatarFallback className="bg-gray-200 text-sm font-medium text-gray-700">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">Open user menu</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
