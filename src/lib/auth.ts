// Lightweight mock auth for the POC demo. Stores a session in localStorage.
// Replace with a real auth provider when wiring up a backend.

const KEY = "aab.auth.user";

export type DemoUser = {
  email: string;
  name: string;
  role: string;
  workspace: string;
  initials: string;
  loggedInAt: string;
};

export const MOCK_USERS: Omit<DemoUser, "loggedInAt">[] = [
  {
    email: "alson.tan@acme.ai",
    name: "Alson Tan",
    role: "AI Team Lead",
    workspace: "Acme AI",
    initials: "AT",
  },
  {
    email: "sophia.hernandez@acme.ai",
    name: "Sophia Hernandez",
    role: "QA Validator",
    workspace: "Acme AI",
    initials: "SH",
  },
  {
    email: "jethro.m@acme.ai",
    name: "Jethro M.",
    role: "AI Developer",
    workspace: "Acme AI",
    initials: "JM",
  },
];

export function getCurrentUser(): DemoUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DemoUser) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

function deriveFromEmail(email: string): Omit<DemoUser, "loggedInAt"> {
  const match = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (match) return match;
  const local = email.split("@")[0] || "user";
  const prettyName = local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(" ");
  const initials = prettyName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return {
    email,
    name: prettyName || "Demo User",
    role: "AI Developer",
    workspace: "Acme AI",
    initials: initials || "DU",
  };
}

export function signIn(email: string): DemoUser {
  const base = deriveFromEmail(email);
  const user: DemoUser = { ...base, loggedInAt: new Date().toISOString() };
  window.localStorage.setItem(KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("aab-auth-change"));
  return user;
}

export function signInAs(user: Omit<DemoUser, "loggedInAt">): DemoUser {
  const session: DemoUser = { ...user, loggedInAt: new Date().toISOString() };
  window.localStorage.setItem(KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("aab-auth-change"));
  return session;
}

export function signOut() {
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("aab-auth-change"));
}
