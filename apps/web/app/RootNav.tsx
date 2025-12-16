import { cookies } from "next/headers";
import { RootNavClient } from "../components/root-nav-client";

type User = {
  id?: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
} | null;

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Polls", href: "/polls" },
  { label: "Transactions", href: "/transactions" },
];

const AUTH_HIDDEN_ROUTES = ["/signin", "/signup"];

const LOGO_PROPS = {
  src: "/logo.svg",
  alt: "SaSvoth logo",
  width: 100,
  height: 144,
  className: "object-contain",
};

const NAV_WRAPPER_CLASSES =
  "mx-auto flex w-full max-w-7xl items-center justify-between px-[2%] py-5 md:py-6 bg-white";

async function refreshToken(
  cookieHeader: string,
  apiBase: string
): Promise<boolean> {
  try {
    const refreshEndpoint = new URL("/api/v1/auth/refresh", apiBase).toString();

    const res = await fetch(refreshEndpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      cache: "no-store",
    });

    if (res.ok) {
      return true;
    }

    console.error("Token refresh failed with status:", res.status);
    return false;
  } catch (err) {
    console.error("Token refresh error:", err);
    return false;
  }
}

async function getCurrentUser(): Promise<User> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map(
        ({ name, value }: { name: string; value: string }) => `${name}=${value}`
      )
      .join("; ");

    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      "http://localhost:8000";
    const userEndpoint = new URL("/api/v1/users/me", apiBase).toString();

    let res = await fetch(userEndpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      cache: "no-store",
    });

    // Handle 401 with token refresh
    if (res.status === 401) {
      console.log("Received 401, attempting token refresh...");
      const refreshSuccess = await refreshToken(cookieHeader, apiBase);

      if (refreshSuccess) {
        console.log("Token refresh successful, retrying user request...");
        // Retry the original request
        res = await fetch(userEndpoint, {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(cookieHeader ? { cookie: cookieHeader } : {}),
          },
          cache: "no-store",
        });
      } else {
        console.log("Token refresh failed, returning null");
        return null;
      }
    }

    if (!res.ok) {
      console.error("Failed to fetch user, status:", res.status);
      return null;
    }

    return res.json();
  } catch (err) {
    console.error("Failed to fetch current user:", err);
    return null;
  }
}

export async function RootNav() {
  const user = await getCurrentUser();

  return (
    <RootNavClient
      user={user}
      navItems={NAV_ITEMS}
      hideOnRoutes={AUTH_HIDDEN_ROUTES}
      wrapperClasses={NAV_WRAPPER_CLASSES}
      logoProps={LOGO_PROPS}
    />
  );
}
