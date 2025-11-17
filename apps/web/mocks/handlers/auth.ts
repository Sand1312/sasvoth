import { delay, http, HttpResponse } from "msw";
import {
  findAccountByIdentifier,
  findAccountByWalletAddress,
  type MockAccount,
} from "../accounts";

type Session = {
  token: string;
  user: MockAccount;
};

type HandlerContext = {
  request: Request;
  cookies?: Record<string, string>;
};

const sessions = new Map<string, Session>();

const TOKEN_COOKIE = "access_token";

const API_BASES = Array.from(
  new Set(
    [
      "/api",
      process.env.NEXT_PUBLIC_API_URL,
      typeof process !== "undefined" ? process.env.API_URL : undefined,
      "http://localhost:8000",
    ]
      .filter(Boolean)
      .map((base) => {
        const normalized = (base as string).trim();
        return normalized === "/api"
          ? normalized
          : normalized.replace(/\/$/, "");
      })
  )
);

const buildTargets = (path: string) =>
  API_BASES.map((base) => {
    if (base === "/api") {
      return `${base}${path}`;
    }
    return `${base}${path}`;
  });

const SIGNIN_TARGETS = buildTargets("/auth/signin");
const LOGOUT_TARGETS = buildTargets("/auth/logout");
const VALIDATE_TARGETS = buildTargets("/auth/validate");
const REFRESH_TARGETS = buildTargets("/auth/refresh");
const USERS_ME_TARGETS = buildTargets("/users/me");

function issueSession(user: MockAccount): Session {
  const token = `${user.username}-${Math.random().toString(36).slice(2)}`;
  const session: Session = { token, user };
  sessions.set(token, session);
  return session;
}

function readToken({ request, cookies }: HandlerContext) {
  const cookieToken = cookies?.[TOKEN_COOKIE];
  if (cookieToken) return cookieToken;

  const header =
    request.headers.get("authorization") ?? request.headers.get("cookie");
  if (!header) return null;

  if (header.toLowerCase().startsWith("bearer")) {
    return header.split(" ")[1] ?? null;
  }

  const match = header.match(
    new RegExp(`${TOKEN_COOKIE}=([^;\\s]+)`, "i")
  );
  return match?.[1] ?? null;
}

function getSession(context: HandlerContext) {
  const token = readToken(context);
  if (!token) return null;
  return sessions.get(token) ?? null;
}

function buildSessionResponse(session: Session) {
  return {
    data: {
      accessToken: session.token,
      user: {
        id: session.user.id,
        username: session.user.username,
        role: session.user.role,
      },
    },
  };
}

function clearSession(context: HandlerContext) {
  const token = readToken(context);
  if (token) sessions.delete(token);
}

const unauthorized = () =>
  HttpResponse.json({ message: "Invalid credentials" }, { status: 401 });

const signinHandler = async ({ request }: HandlerContext) => {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  if (!["email", "wallet"].includes(type ?? "")) {
    return HttpResponse.json(
      { message: `Mock only supports type=email or wallet, received ${type}` },
      { status: 400 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    username?: string;
    email?: string;
    password?: string;
    address?: string;
    walletAddress?: string;
  };

  let user: MockAccount | undefined;
  if (type === "wallet") {
    const walletAddress = body.address ?? body.walletAddress;
    user = findAccountByWalletAddress(walletAddress);
  } else {
    const identifier = body.username ?? body.email;
    user = findAccountByIdentifier(identifier, body.password);
  }

  await delay(300);

  if (!user) {
    return unauthorized();
  }

  const session = issueSession(user);
  return HttpResponse.json(buildSessionResponse(session), {
    headers: {
      "Set-Cookie": `${TOKEN_COOKIE}=${session.token}; Path=/; HttpOnly; SameSite=Lax`,
    },
  });
};

const logoutHandler = async (context: HandlerContext) => {
  clearSession(context);
  await delay(100);
  return HttpResponse.json({ success: true });
};

const validateHandler = async (context: HandlerContext) => {
  const session = getSession(context);
  await delay(150);
  if (!session) return unauthorized();
  return HttpResponse.json({ data: { ok: true } });
};

const refreshHandler = async (context: HandlerContext) => {
  const session = getSession(context);
  await delay(150);
  if (!session) return unauthorized();
  return HttpResponse.json(buildSessionResponse(session), {
    headers: {
      "Set-Cookie": `${TOKEN_COOKIE}=${session.token}; Path=/; HttpOnly; SameSite=Lax`,
    },
  });
};

const meHandler = async (context: HandlerContext) => {
  const session = getSession(context);
  await delay(120);
  if (!session) return unauthorized();
  return HttpResponse.json({
    id: session.user.id,
    username: session.user.username,
    role: session.user.role,
  });
};

export const authHandlers = [
  ...SIGNIN_TARGETS.map((target) => http.post(target, signinHandler)),
  ...LOGOUT_TARGETS.map((target) => http.post(target, logoutHandler)),
  ...VALIDATE_TARGETS.map((target) => http.post(target, validateHandler)),
  ...REFRESH_TARGETS.map((target) => http.post(target, refreshHandler)),
  ...USERS_ME_TARGETS.map((target) => http.get(target, meHandler)),
];
