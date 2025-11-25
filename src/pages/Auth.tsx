import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Navigate, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const navigate = useNavigate();
  const { user, sendOtp, verifyOtp } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"enter-phone" | "enter-otp">("enter-phone");
  const [loading, setLoading] = useState(false);

  // Validation State
  const [phoneError, setPhoneError] = useState("");

  if (user) return <Navigate to="/" replace />;

  // --- 1. REAL-TIME UI VALIDATION ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-numbers immediately
    const value = e.target.value.replace(/\D/g, "");

    // Prevent typing more than 10 digits
    if (value.length > 10) return;

    setPhone(value);

    // Real-time validation feedback
    if (value.length > 0) {
      if (!/^[6-9]/.test(value)) {
        setPhoneError("Mobile number must start with 6, 7, 8, or 9");
      } else if (value.length < 10) {
        setPhoneError(""); // Don't show error while typing incomplete number
      } else {
        setPhoneError(""); // Valid!
      }
    } else {
      setPhoneError("");
    }
  };

  // --- 2. SEND OTP (BLOCKED IF INVALID) ---
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Final Check before calling API
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(phone)) {
      setPhoneError("Please enter a valid 10-digit Indian number");
      toast.error("Invalid Mobile Number");
      return; // ⛔️ STOP HERE. DO NOT CALL SERVER.
    }

    setLoading(true);
    try {
      await sendOtp(phone);
      setStep("enter-otp");
    } catch (err) {
      // Context handles error toast
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(phone, otp, isSignUp ? name : undefined);
    } catch (err) {
      // Context handles error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
      <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
        <Card className="relative w-full max-w-md p-8 rounded-xl shadow-xl border bg-card">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="absolute right-4 top-4 p-1 rounded-md hover:bg-muted transition"
          >
            <X className="h-5 w-5" />
          </Button>

          <h2 className="text-2xl font-semibold text-center mb-8">
            {isSignUp ? "Sign Up" : "Sign In"}
          </h2>

          {step === "enter-phone" && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              {isSignUp && (
                <div className="space-y-2">
                  <Label>Your Name *</Label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-12"
                    placeholder="Enter your name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Mobile Number *</Label>
                <div className="flex gap-2 relative">
                  <div className="flex items-center justify-center border rounded-md px-3 bg-muted text-muted-foreground font-medium h-12">
                    +91
                  </div>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    required
                    className={`h-12 ${
                      phoneError
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                    placeholder="9876543210"
                  />
                </div>
                {/* UI Error Message */}
                {phoneError && (
                  <p className="text-red-500 text-xs font-medium animate-pulse mt-1">
                    {phoneError}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                // Disable button if phone is invalid (Visual Block)
                disabled={loading || phone.length !== 10 || !!phoneError}
                className="w-full h-12 text-base font-semibold"
              >
                {loading ? "Sending OTP..." : "SEND OTP"}
              </Button>
            </form>
          )}

          {step === "enter-otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-2">
                <Label>Enter OTP</Label>
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                  maxLength={6}
                  className="h-12 text-center text-lg tracking-widest"
                  placeholder="6-digit OTP"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold"
              >
                {loading ? "Verifying..." : "VERIFY OTP"}
              </Button>

              <button
                type="button"
                onClick={() => handleSendOtp()}
                className="text-sm text-primary hover:underline block mx-auto mt-3"
              >
                Resend OTP
              </button>

              <button
                type="button"
                onClick={() => setStep("enter-phone")}
                className="text-xs text-muted-foreground hover:text-primary block mx-auto mt-2"
              >
                Change Phone Number
              </button>
            </form>
          )}

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setStep("enter-phone");
                setPhoneError("");
                setPhone("");
                setName("");
              }}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp ? (
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
        </Card>
      </div>
    </>
  );
}
