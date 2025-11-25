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
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// CONFIG: 24 Hours in Milliseconds
const IDLE_TIMEOUT_MS = 24 * 60 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- 1. INITIAL SESSION CHECK ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session) checkIdleTimeout(); // Check immediately on load
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) updateLastActivity(); // Reset timer on auth change
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- 2. ACTIVITY TRACKER (IDLE TIMEOUT) ---

  const updateLastActivity = () => {
    // Store the timestamp of the last click/keypress
    localStorage.setItem("app_last_active", Date.now().toString());
  };

  const checkIdleTimeout = useCallback(async () => {
    const lastActive = localStorage.getItem("app_last_active");
    if (!lastActive) return;

    const now = Date.now();
    const diff = now - parseInt(lastActive, 10);

    // If idle for more than 24 hours
    if (diff > IDLE_TIMEOUT_MS) {
      console.log("Session expired due to inactivity");
      toast.info("Session expired due to inactivity. Please login again.");
      await signOut();
    }
  }, []);

  useEffect(() => {
    // If no user, don't listen for events
    if (!user) return;

    // A. Listen for user activity
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    const handleActivity = () => updateLastActivity();

    events.forEach((event) => window.addEventListener(event, handleActivity));

    // B. Check for expiry every 1 minute
    const interval = setInterval(checkIdleTimeout, 60 * 1000);

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
      clearInterval(interval);
    };
  }, [user, checkIdleTimeout]);

  // --- 3. AUTH FUNCTIONS ---

  const sendOtp = async (phone: string) => {
    try {
      const fullPhone = phone.startsWith("+") ? phone : `+91${phone}`;
      const { data, error } = await supabase.functions.invoke("auth-otp", {
        body: { action: "send", phone: fullPhone },
      });

      if (error || (data && data.error)) {
        throw new Error(data?.error || error?.message || "Failed to send OTP");
      }
      toast.success("OTP sent successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
      throw err;
    }
  };

  const verifyOtp = async (phone: string, otp: string, name?: string) => {
    try {
      const fullPhone = phone.startsWith("+") ? phone : `+91${phone}`;

      const { data, error } = await supabase.functions.invoke("auth-otp", {
        body: { action: "verify", phone: fullPhone, otp },
      });

      if (error || (data && data.error))
        throw new Error(data?.error || "Invalid OTP");

      if (data?.session) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        if (sessionError) throw sessionError;
      }

      // Update Profile if Name provided
      if (name) {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        if (currentUser) {
          await supabase.from("profiles").upsert({
            id: currentUser.id,
            phone: fullPhone,
            full_name: name,
          });
        }
      }

      // Set initial activity timestamp
      updateLastActivity();

      toast.success("Welcome!");
      navigate("/");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
      throw err;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("app_last_active"); // Clean up
    navigate("/auth");
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, sendOtp, verifyOtp, signOut }}
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
