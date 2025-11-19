export function forwardSetCookies(from: Response, to: Headers) {
  const headerWithHelper = from.headers as Headers & {
    getSetCookie?: () => string[];
    getAll?: (name: string) => string[];
  };

  const fromHelper =
    headerWithHelper.getSetCookie?.() ?? headerWithHelper.getAll?.("set-cookie");

  const setCookies: string[] = [];

  if (fromHelper && fromHelper.length) {
    setCookies.push(...fromHelper);
  } else {
    // Fallback for environments where getSetCookie/getAll are unavailable.
    from.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        setCookies.push(value);
      }
    });
  }

  if (!setCookies.length) {
    const single = from.headers.get("set-cookie");
    if (single) {
      setCookies.push(single);
    }
  }

  setCookies.forEach((cookie) => {
    to.append("set-cookie", cookie);
  });
}
