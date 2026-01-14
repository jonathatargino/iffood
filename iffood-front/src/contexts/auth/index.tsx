import { useEffect, useState } from "react";
import { AuthContext } from "./context";
import type { Session } from "@supabase/supabase-js";
import { supabaseClient } from "./supabase-client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const {
        data: { session },
        error,
      } = await supabaseClient.auth.getSession();

      console.log({ session, error });

      if (error) {
        console.error(error);
        return;
      }

      setSession(session);
      setIsInitialized(true);
    };

    initialize();
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabaseClient.auth.signOut();

    setSession(null);
    return { error: !!error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: import.meta.env.VITE_APPLICATION_URL,
      },
    });

    return { error: !!error };
  };

  return (
    <AuthContext.Provider
      value={{ session, isInitialized, signOut, signInWithGoogle }}
    >
      {children}
    </AuthContext.Provider>
  );
}
