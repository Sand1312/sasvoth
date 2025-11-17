declare global {
  // eslint-disable-next-line no-var
  var __MSW_SERVER_STARTED__?: boolean;
}

export async function register() {
  const isNode = process.env.NEXT_RUNTIME === "nodejs";
  const mockingEnabled = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

  if (!isNode || !mockingEnabled || globalThis.__MSW_SERVER_STARTED__) {
    return;
  }

  const { server } = await import("./mocks/server");
  server.listen({ onUnhandledRequest: "bypass" });
  globalThis.__MSW_SERVER_STARTED__ = true;
}
