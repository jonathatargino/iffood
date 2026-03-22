import { createContext, useContext } from "react";
import type { AuthContextValue } from "./types";

export const AuthContext = createContext<AuthContextValue>({
  session: null,
  isInitialized: false,
  userProfile: null,
  signOut: async () => ({ error: false }),
  signInWithGoogle: async () => ({ error: false }),
});

export function useAuth() {
  return useContext(AuthContext);
}
