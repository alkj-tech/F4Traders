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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session) checkIdleTimeout();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) updateLastActivity();

      // -----------------------------------------------------
      // FIX: REMOVED THE NAVIGATION LOGIC HERE
      // The email link already handles the redirect.
      // Navigating here wipes the secure token from the URL.
      // -----------------------------------------------------
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) throw error;
      if (data.user) {
        await supabase
          .from("profiles")
          .upsert({ id: data.user.id, full_name: name });
      }
      toast.success("Account created successfully!");
      navigate("/");
    } catch (error: any) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // 1. Get the base URL (e.g., http://localhost:8080)
      const origin = window.location.origin;

      // 2. Check if we are running inside a subfolder (like /F4Traders)
      // This prevents the link from breaking on GitHub Pages or sub-path deployments
      const pathPrefix = window.location.pathname.startsWith("/F4Traders")
        ? "/F4Traders"
        : "";

      // 3. Construct the correct URL
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
      // 1. Double check we have a session
      // We assume the URL token has been processed by now.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          "Session expired or invalid. Please request a new reset link."
        );
      }

      // 2. Perform Update
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "/" },
    });
    if (error) toast.error(error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("app_last_active");
    navigate("/auth");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
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
