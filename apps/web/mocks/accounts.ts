export type MockRole = "user" | "admin";

export type MockAccount = {
  id: string;
  username: string;
  password: string;
  role: MockRole;
  walletAddress?: string;
};

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    id: "user-1",
    username: "user",
    password: "user",
    role: "user",
    walletAddress: "0xuser000000000000000000000000000000000001",
  },
  {
    id: "admin-1",
    username: "admin",
    password: "admin",
    role: "admin",
    walletAddress: "0xadmin00000000000000000000000000000000001",
  },
];

export function findAccountByIdentifier(
  identifier: string | undefined,
  password: string | undefined
) {
  if (!identifier || !password) return undefined;
  const normalized = identifier.trim().toLowerCase();
  return MOCK_ACCOUNTS.find(
    (account) =>
      account.username.toLowerCase() === normalized &&
      account.password === password
  );
}

export function findAccountByUsername(username: string | undefined) {
  if (!username) return undefined;
  const normalized = username.trim().toLowerCase();
  return MOCK_ACCOUNTS.find(
    (account) => account.username.toLowerCase() === normalized
  );
}

export function findAccountByWalletAddress(address: string | undefined) {
  if (!address) return undefined;
  const normalized = address.trim().toLowerCase();
  return MOCK_ACCOUNTS.find(
    (account) =>
      account.walletAddress &&
      account.walletAddress.toLowerCase() === normalized
  );
}
