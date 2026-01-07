import type { Session } from "@supabase/supabase-js";

export interface AuthContextValue {
  session: Session | null;
  isInitialized: boolean;

  signOut: () => Promise<{ error: boolean }>;
  signInWithGoogle: () => Promise<{ error: boolean }>;
}
