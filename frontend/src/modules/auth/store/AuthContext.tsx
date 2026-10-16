import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchMe } from "../../../shared/api-client/api";
import {
  isSupabaseAuth,
  getAuthProvider,
  supabase,
  type AuthProviderType,
} from "../../../shared/api-client/supabase";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  provider: AuthProviderType;
  login: (token: string, user: User) => void;
  logout: () => Promise<void> | void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const provider = getAuthProvider();
  const supabaseActive = isSupabaseAuth();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(
    supabaseActive ? true : !!localStorage.getItem("token")
  );

  useEffect(() => {
    // ── SUPABASE AUTH LIFECYCLE ──────────────────────────────────────────────
    if (supabaseActive) {
      if (!supabase) {
        console.warn(
          "Supabase Auth is active (VITE_AUTH_PROVIDER=supabase), but Supabase client credentials are missing. Falling back to unauthenticated state."
        );
        setLoading(false);
        return;
      }

      // 1. Initial session check
      supabase.auth
        .getSession()
        .then(({ data: { session }, error }) => {
          if (error || !session) {
            setUser(null);
            localStorage.removeItem("token");
          } else {
            localStorage.setItem("token", session.access_token);
            const meta = session.user.user_metadata || {};
            const displayName =
              meta.full_name || meta.name || session.user.email?.split("@")[0] || "Architect";
            setUser({
              id: session.user.id,
              email: session.user.email || "",
              name: displayName,
            });
          }
        })
        .catch((err) => {
          console.error("Failed to restore Supabase session:", err);
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });

      // 2. Real-time auth state subscription
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          localStorage.setItem("token", session.access_token);
          const meta = session.user.user_metadata || {};
          const displayName =
            meta.full_name || meta.name || session.user.email?.split("@")[0] || "Architect";
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            name: displayName,
          });
        } else {
          localStorage.removeItem("token");
          setUser(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    // ── LEGACY CUSTOM JWT FLOW (VITE_AUTH_PROVIDER=jwt) ──────────────────────
    const token = localStorage.getItem("token");
    if (token) {
      fetchMe()
        .then((userData) => setUser(userData))
        .catch(() => {
          localStorage.removeItem("token");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [supabaseActive]);

  const login = (token: string, userData: User) => {
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const logout = async () => {
    if (supabaseActive && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Supabase signOut error:", err);
      }
    }
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, provider, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
