import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (
    email: string,
    password: string,
    name: string
  ) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const IDLE_TIMEOUT_MS = 24 * 60 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- 1. FETCH ROLE (FIXED FOR YOUR DB SCHEMA) ---
  const fetchUserRole = async (userId: string) => {
    try {
      // Your DB stores roles in 'user_roles', NOT 'profiles'
      const { data, error } = await supabase
        .from("user_roles") // <--- Correct Table
        .select("role")
        .eq("user_id", userId) // <--- Correct Foreign Key
        .maybeSingle(); // <--- Safer than single()

      if (error) {
        console.error("Error fetching role:", error);
        return;
      }

      if (data) {
        setRole(data.role);
      } else {
        // Fallback if trigger hasn't run yet (rare)
        setRole("customer");
      }
    } catch (error) {
      console.error("Role fetch error:", error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRole(session.user.id);
        checkIdleTimeout();
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        updateLastActivity();
        fetchUserRole(session.user.id);
      } else {
        setRole(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateLastActivity = () => {
    localStorage.setItem("app_last_active", Date.now().toString());
  };

  const checkIdleTimeout = useCallback(async () => {
    const lastActive = localStorage.getItem("app_last_active");
    if (!lastActive) return;
    const now = Date.now();
    const diff = now - parseInt(lastActive, 10);
    if (diff > IDLE_TIMEOUT_MS) {
      toast.info("Session expired due to inactivity. Please login again.");
      await signOut();
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    const handleActivity = () => updateLastActivity();
    events.forEach((event) => window.addEventListener(event, handleActivity));
    const interval = setInterval(checkIdleTimeout, 60 * 1000);
    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
      clearInterval(interval);
    };
  }, [user, checkIdleTimeout]);

  // --- AUTH FUNCTIONS ---

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success("Welcome back!");
      navigate("/");
    } catch (error: any) {
      throw error;
    }
  };

  const signupWithEmail = async (
    email: string,
    password: string,
    name: string
  ) => {
    try {
      // 1. Create Auth User
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) throw error;

      // NOTE: We do NOT need to manually insert into 'profiles' or 'user_roles' here.
      // Your SQL Trigger 'on_auth_user_created' handles this automatically!

      toast.success("Account created successfully!");
      navigate("/");
    } catch (error: any) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const origin = window.location.origin;
      const pathPrefix = window.location.pathname.startsWith("/F4Traders")
        ? "/F4Traders"
        : "";
      const redirectUrl = `${origin}${pathPrefix}/auth?view=update_password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      if (error) throw error;
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
      throw error;
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          "Session expired or invalid. Please request a new reset link."
        );
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success("Password updated successfully!");
      navigate("/");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Dynamic redirect for Localhost vs GitHub Pages
      const redirectUrl = window.location.href.split("/auth")[0];

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("app_last_active");
    setRole(null);
    navigate("/auth");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        loginWithEmail,
        signupWithEmail,
        resetPassword,
        updatePassword,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
