"use client";
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

// Mobile Bottom Nav Icons (minimalist SVG)
const HomeIcon = ({ active }: { active?: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? "#fff" : "rgba(255,255,255,0.5)"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const PollsIcon = ({ active }: { active?: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? "#fff" : "rgba(255,255,255,0.5)"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 20V10" />
    <path d="M12 20V4" />
    <path d="M6 20v-6" />
  </svg>
);

const CreateIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#000"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SubscriptionsIcon = ({ active }: { active?: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? "#fff" : "rgba(255,255,255,0.5)"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const SettingsIcon = ({ active }: { active?: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? "#fff" : "rgba(255,255,255,0.5)"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// Mobile Bottom Navigation Component
function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: "/dashboard", icon: HomeIcon, label: "Home" },
    { href: "/polls", icon: PollsIcon, label: "Polls" },
    { href: "/subscriptions", icon: SubscriptionsIcon, label: "Subs" },
    { href: "/settings", icon: SettingsIcon, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-black px-2 py-2 pb-[max(8px,env(safe-area-inset-bottom))] md:hidden">
      {/* Home */}
      <Link
        href="/dashboard"
        className="flex flex-col items-center gap-1 px-3 py-1"
      >
        <HomeIcon
          active={
            pathname === "/dashboard" || pathname?.startsWith("/dashboard")
          }
        />
        <span
          className={`text-[10px] ${pathname === "/dashboard" || pathname?.startsWith("/dashboard") ? "text-white font-medium" : "text-gray-400"}`}
        >
          Home
        </span>
      </Link>

      {/* Polls */}
      <Link
        href="/polls"
        className="flex flex-col items-center gap-1 px-3 py-1"
      >
        <PollsIcon active={pathname?.startsWith("/polls")} />
        <span
          className={`text-[10px] ${pathname?.startsWith("/polls") ? "text-white font-medium" : "text-gray-400"}`}
        >
          Polls
        </span>
      </Link>

      {/* Center Create Button */}
      <button
        onClick={() => router.push("/polls/new")}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition-transform active:scale-95"
        aria-label="Create a new idea"
      >
        <CreateIcon />
      </button>

      {/* Subscriptions */}
      <Link
        href="/subscriptions"
        className="flex flex-col items-center gap-1 px-3 py-1"
      >
        <SubscriptionsIcon active={pathname?.startsWith("/subscriptions")} />
        <span
          className={`text-[10px] ${pathname?.startsWith("/subscriptions") ? "text-white font-medium" : "text-gray-400"}`}
        >
          Subs
        </span>
      </Link>

      {/* Settings */}
      <Link
        href="/settings"
        className="flex flex-col items-center gap-1 px-3 py-1"
      >
        <SettingsIcon active={pathname?.startsWith("/settings")} />
        <span
          className={`text-[10px] ${pathname?.startsWith("/settings") ? "text-white font-medium" : "text-gray-400"}`}
        >
          Settings
        </span>
      </Link>
    </nav>
  );
}

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
    pathname?.startsWith(route),
  );

  // Dynamic Navigation Items
  const computedNavItems = navItems.map((item) =>
    isAdminPath ? { ...item, href: `/admin${item.href}` } : item,
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
    <>
      <nav className={`${wrapperClasses} hidden md:flex`}>
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
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
      <MobileBottomNav />
    </>
  );
}
