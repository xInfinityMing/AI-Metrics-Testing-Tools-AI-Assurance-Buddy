import { useEffect, useState } from "react";
import { getCurrentUser, type DemoUser } from "@/lib/auth";

/**
 * Subscribes to the mock auth session in localStorage.
 * Re-renders when sign-in / sign-out fires the "aab-auth-change" event,
 * and also when another tab updates the session via the storage event.
 */
export function useCurrentUser(): DemoUser | null {
  const [user, setUser] = useState<DemoUser | null>(() => getCurrentUser());

  useEffect(() => {
    const sync = () => setUser(getCurrentUser());
    window.addEventListener("aab-auth-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("aab-auth-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return user;
}
