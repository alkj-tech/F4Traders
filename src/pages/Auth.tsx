import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

type AuthView = "login" | "signup" | "forgot_password" | "update_password";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    user,
    loginWithEmail,
    signupWithEmail,
    resetPassword,
    updatePassword,
  } = useAuth();

  // Initialize view from URL
  const [view, setView] = useState<AuthView>(() => {
    if (searchParams.get("view") === "update_password")
      return "update_password";
    return "login";
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // NEW: Confirm Password State
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  // Sync state if URL changes later
  useEffect(() => {
    if (searchParams.get("view") === "update_password") {
      setView("update_password");
    }
  }, [searchParams]);

  const isPasswordUpdate =
    view === "update_password" ||
    searchParams.get("view") === "update_password";

  // Redirect if logged in (unless updating password)
  if (user && !isPasswordUpdate) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (view === "signup") {
        await signupWithEmail(email, password, name);
      } else if (view === "login") {
        await loginWithEmail(email, password);
      } else if (view === "forgot_password") {
        await resetPassword(email);
      } else if (view === "update_password") {
        // --- NEW: VALIDATION CHECK ---
        if (password !== confirmPassword) {
          toast.error("Passwords do not match!");
          setLoading(false);
          return;
        }

        await updatePassword(password);
      }
    } catch (err: any) {
      const errorMessage = err.message || "";
      if (errorMessage.includes("Invalid login credentials")) {
        toast.error(
          "Incorrect password. If you signed up with Google, please use the Google button."
        );
      } else if (errorMessage.includes("User already registered")) {
        toast.error(
          "Account already exists. Please Sign In with Google or Email."
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
      <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
        <Card className="relative w-full max-w-md p-8 rounded-xl shadow-xl border bg-card">
          {view !== "update_password" && (
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              className="absolute right-4 top-4 p-1 rounded-md hover:bg-muted transition"
            >
              <X className="h-5 w-5" />
            </Button>
          )}

          <h2 className="text-2xl font-semibold text-center mb-6">
            {view === "signup" && "Create Account"}
            {view === "login" && "Welcome Back"}
            {view === "forgot_password" && "Reset Password"}
            {view === "update_password" && "Set New Password"}
          </h2>

          {(view === "login" || view === "signup") && (
            <div className="mb-6">
              <GoogleLoginButton />
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === "signup" && (
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12"
                  placeholder="John Doe"
                />
              </div>
            )}

            {(view === "login" ||
              view === "signup" ||
              view === "forgot_password") && (
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                  placeholder="name@example.com"
                />
              </div>
            )}

            {(view === "login" ||
              view === "signup" ||
              view === "update_password") && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>
                    {view === "update_password" ? "New Password" : "Password"}
                  </Label>
                  {view === "login" && (
                    <button
                      type="button"
                      onClick={() => setView("forgot_password")}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            )}

            {/* --- NEW: CONFIRM PASSWORD INPUT --- */}
            {view === "update_password" && (
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-semibold mt-2"
            >
              {loading
                ? "Please wait..."
                : view === "signup"
                ? "Sign Up"
                : view === "login"
                ? "Sign In"
                : view === "update_password"
                ? "Update Password"
                : "Send Reset Link"}
            </Button>

            {view === "forgot_password" && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setView("login")}
                className="w-full mt-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
              </Button>
            )}
          </form>

          {(view === "login" || view === "signup") && (
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => {
                  setView(view === "signup" ? "login" : "signup");
                  setEmail("");
                  setPassword("");
                  setName("");
                }}
                className="text-sm text-primary hover:underline"
              >
                {view === "signup" ? (
                  <>
                    Already have an account?{" "}
                    <span className="font-semibold">Sign In</span>
                  </>
                ) : (
                  <>
                    Don’t have an account?{" "}
                    <span className="font-semibold">Sign Up</span>
                  </>
                )}
              </button>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
