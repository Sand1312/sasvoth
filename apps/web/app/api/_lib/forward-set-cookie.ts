export function forwardSetCookies(from: Response, to: Headers) {
  const headerWithHelper = from.headers as Headers & {
    getSetCookie?: () => string[];
    getAll?: (name: string) => string[];
  };

  const fromHelper =
    headerWithHelper.getSetCookie?.() ?? headerWithHelper.getAll?.("set-cookie");

  if (fromHelper && fromHelper.length) {
    fromHelper.forEach((cookie) => {
      to.append("set-cookie", cookie);
    });
    return;
  }

  const single = from.headers.get("set-cookie");
  if (single) {
    to.append("set-cookie", single);
  }
}
