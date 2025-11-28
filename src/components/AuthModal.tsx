import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

const LOGO_URL = "/mnt/data/e15e22bb-60b8-4747-8e7b-443b69ec1cce.png";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthView = "login" | "signup" | "forgot_password";

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { loginWithEmail, signupWithEmail, resetPassword } = useAuth();

  const [view, setView] = useState<AuthView>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setLoading(false);
      setView("signup");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === "signup") {
        await signupWithEmail(email, password, name);
        onSuccess?.();
        onClose();
      } else if (view === "login") {
        await loginWithEmail(email, password);
        onSuccess?.();
        onClose();
      } else if (view === "forgot_password") {
        await resetPassword(email);
        // Do NOT close modal here; let them see the toast confirmation
      }
    } catch (err: any) {
      console.error("Auth Modal Error:", err);
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* We use sm:max-w-[440px] to make the auth modal slightly narrower than the default dialog.
        p-0 removes default padding so we can control it in the inner div.
      */}
      <DialogContent className="sm:max-w-[440px] p-0 gap-0 bg-card">
        {/* Inner container with responsive padding (p-6 for mobile, p-8 for desktop) */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-center mb-6">
            <img
              src={LOGO_URL}
              alt="logo"
              className="h-12 w-12 rounded-md object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>

          <h2 className="text-2xl font-semibold text-center mb-6">
            {view === "signup" && "Create Account"}
            {view === "login" && "Sign In"}
            {view === "forgot_password" && "Reset Password"}
          </h2>

          {view !== "forgot_password" && (
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

            {view !== "forgot_password" && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Password</Label>
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

          {view !== "forgot_password" && (
            <div className="text-center mt-4">
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
                {view === "signup"
                  ? "Already have an account? Sign In"
                  : "Don't have an account? Sign Up"}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
