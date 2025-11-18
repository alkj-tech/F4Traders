import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Navigate, useNavigate } from "react-router-dom";
import { X } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(signupEmail, signupPassword, signupName);
      } else {
        await signIn(loginEmail, loginPassword);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* OVERLAY to show background page dimmed */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />

      {/* CENTERED MODAL */}
      <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
        <Card className="relative w-full max-w-md p-8 rounded-xl shadow-xl border bg-card">
          {/* CLOSE BUTTON */}
          <Button
            onClick={() => navigate(-1)}
            className="absolute right-4 top-4 p-1 rounded-md hover:bg-muted transition"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* TITLE */}
          <h2 className="text-2xl font-semibold text-center mb-8">
            {isSignUp ? "Sign Up" : "Sign In"}
          </h2>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* SIGN UP FIELDS */}
            {isSignUp && (
              <div className="space-y-2">
                <Label>Your Name *</Label>
                <Input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  required
                  className="h-12"
                  placeholder="Enter your name"
                />
              </div>
            )}

            {/* EMAIL */}
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={isSignUp ? signupEmail : loginEmail}
                onChange={(e) =>
                  isSignUp
                    ? setSignupEmail(e.target.value)
                    : setLoginEmail(e.target.value)
                }
                required
                className="h-12"
                placeholder="Enter your email"
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                value={isSignUp ? signupPassword : loginPassword}
                onChange={(e) =>
                  isSignUp
                    ? setSignupPassword(e.target.value)
                    : setLoginPassword(e.target.value)
                }
                required
                minLength={6}
                className="h-12"
                placeholder="Enter your password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-semibold"
            >
              {loading
                ? "Processing..."
                : isSignUp
                ? "CREATE ACCOUNT"
                : "SIGN IN"}
            </Button>
          </form>

          {/* SWITCH LOGIN <-> SIGNUP */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <span className="font-semibold">Sign In</span>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <span className="font-semibold">Sign Up</span>
                </>
              )}
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}
