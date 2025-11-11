"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@sasvoth/ui/button";
import { useAuth } from "../hooks";

export function RootNav() {
  const { user, isLoading, signout } = useAuth();
  const pathname = usePathname();
  const isLoggedIn = !!user;

  const handleLogout = async () => {
    try {
      await signout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Hide login button on signin/signup pages
  const showLoginButton =
    !isLoggedIn && !["/signin", "/signup"].includes(pathname);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <nav className="flex items-center justify-between px-8 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-6">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={40}
            height={80}
            className="object-contain"
          />
        </div>
        <div className="text-sm text-gray-400">Loading...</div>
      </nav>
    );
  }

  return (
    <nav className="flex items-center justify-between px-8 py-3 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-6">
        <Image
          src="/logo.svg"
          alt="Logo"
          width={40}
          height={80}
          className="object-contain"
        />
        <a
          href="/"
          className="flex items-center text-gray-900 hover:text-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            className="mr-1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0h6"
            />
          </svg>
          Home
        </a>
      </div>

      {/* Show Login or Logout based on auth state */}
      <div className="flex items-center gap-4">
        {isLoggedIn && (
          <span className="text-sm text-gray-600">
            Welcome, {user?.email || user?.name || "User"}
          </span>
        )}
        {isLoggedIn ? (
          <Button variant="outline" onClick={handleLogout}>
            Sign Out
          </Button>
        ) : showLoginButton ? (
          <Link href="/signin">
            <Button>Login</Button>
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
