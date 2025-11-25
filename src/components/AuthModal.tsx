import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Use the logo if available, or remove img tag if not needed
const LOGO_URL = "/mnt/data/e15e22bb-60b8-4747-8e7b-443b69ec1cce.png";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { sendOtp, verifyOtp, signOut } = useAuth();

  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [step, setStep] = useState<"phone" | "otp">("phone");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  // Reset when opening
  useEffect(() => {
    if (!isOpen) {
      setStep("phone");
      setLoading(false);
      setOtp("");
      setPhoneError("");
    }
  }, [isOpen]);

  // --- 1. STRICT REAL-TIME VALIDATION ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");

    // Prevent typing > 10
    if (value.length > 10) return;

    setPhone(value);

    if (value.length > 0) {
      if (!/^[6-9]/.test(value)) {
        setPhoneError("Number must start with 6, 7, 8, or 9");
      } else if (value.length === 10) {
        setPhoneError("");
      } else {
        setPhoneError("");
      }
    } else {
      setPhoneError("");
    }
  };

  // --- 2. SEND OTP (BLOCKED IF INVALID) ---
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Final check
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(phone)) {
      setPhoneError("Enter a valid 10-digit Indian number");
      toast.error("Invalid Mobile Number");
      return;
    }

    setLoading(true);
    try {
      await sendOtp(phone);
      setStep("otp");
    } catch (err) {
      // Context handles error
    } finally {
      setLoading(false);
    }
  };

  // --- 3. VERIFY OTP ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(phone, otp, mode === "signup" ? name : undefined);
      onSuccess?.();
      onClose();
    } catch (err) {
      // Context handles error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] p-0 gap-0 overflow-hidden bg-card rounded-lg">
        <div className="relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-8">
            {/* Logo Section */}
            <div className="flex items-center justify-center mb-6">
              <img
                src={LOGO_URL}
                alt="logo"
                className="h-12 w-12 rounded-md object-cover"
                onError={(e) => (e.currentTarget.style.display = "none")} // Hide if broken
              />
            </div>

            <h2 className="text-2xl font-semibold text-center mb-4">
              {mode === "signup" ? "Sign Up (OTP)" : "Sign In (OTP)"}
            </h2>

            {step === "phone" ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                {mode === "signup" && (
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
                  {phoneError && (
                    <p className="text-red-500 text-xs font-medium mt-1">
                      {phoneError}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || phone.length !== 10 || !!phoneError}
                  className="w-full h-12 text-base font-semibold"
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-2">
                  <Label>Enter OTP *</Label>
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

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-12 text-base font-semibold"
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </Button>

                  <Button
                    type="button"
                    onClick={() => setStep("phone")}
                    className="flex-1 h-12 text-base font-semibold"
                    variant="outline"
                  >
                    Edit Phone
                  </Button>
                </div>
              </form>
            )}

            {/* Toggle Mode */}
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setMode((m) => (m === "signup" ? "login" : "signup"));
                  setStep("phone");
                  setPhoneError("");
                  setPhone("");
                }}
                className="text-sm text-primary hover:underline"
              >
                {mode === "signup"
                  ? "Already have an account? Sign In"
                  : "Don't have an account? Sign Up"}
              </button>
            </div>

            {/* Debug / Logout Footer (Optional, good for dev) */}
            <div className="text-center mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                Session TTL: 24h (Idle Timeout)
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                onClick={async () => {
                  await signOut();
                  onSuccess?.();
                  onClose();
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
