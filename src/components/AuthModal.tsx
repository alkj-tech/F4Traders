import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { sendOtp, verifyOtp } = useAuth();

  // State
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<"phone" | "otp">("phone");

  // Form Data
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneError, setPhoneError] = useState(""); // Validation Error State
  const [loading, setLoading] = useState(false);

  // Reset state when modal closes
  const handleClose = () => {
    setStep("phone");
    setOtp("");
    setPhoneError("");
    onClose();
  };

  // --- 1. STRICT PHONE INPUT HANDLER ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers
    const value = e.target.value.replace(/\D/g, "");

    // Limit to 10 digits
    if (value.length <= 10) {
      setPhone(value);
      if (phoneError) setPhoneError(""); // Clear error while typing
    }
  };

  // --- 2. VALIDATION LOGIC ---
  const validatePhone = (num: string) => {
    const indianPhoneRegex = /^[6-9]\d{9}$/; // Starts with 6-9, exactly 10 digits
    if (!num) return "Phone number is required";
    if (num.length !== 10) return "Phone number must be 10 digits";
    if (!indianPhoneRegex.test(num)) return "Invalid Indian mobile number";
    return "";
  };

  // --- 3. SEND OTP ---
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validatePhone(phone);
    if (error) {
      setPhoneError(error);
      return;
    }

    setLoading(true);
    try {
      await sendOtp(phone);
      setStep("otp");
    } catch (e) {
      // Context handles toast
    } finally {
      setLoading(false);
    }
  };

  // --- 4. VERIFY OTP ---
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(phone, otp, mode === "signup" ? name : undefined);
      handleClose(); // Close on success
    } catch (e) {
      // Context handles toast
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setStep("phone");
    setOtp("");
    setPhoneError("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden bg-card">
        {/* Header */}
        <div className="relative p-6 pb-2 text-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {step === "phone"
              ? mode === "login"
                ? "Login to continue"
                : "Register to get started"
              : `Verify +91 ${phone}`}
          </p>
        </div>

        <div className="p-6 pt-2">
          {step === "phone" ? (
            <form onSubmit={handleSend} className="space-y-4">
              {/* Name Input - Only for Signup */}
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Mobile Number</Label>
                {/* Updated UI: +91 Prefix Box */}
                <div className="flex gap-2">
                  <div className="flex items-center justify-center border rounded-md px-3 bg-muted text-muted-foreground font-medium h-11">
                    +91
                  </div>
                  <Input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={handlePhoneChange}
                    className={`h-11 ${phoneError ? "border-red-500" : ""}`}
                  />
                </div>
                {phoneError && (
                  <p className="text-red-500 text-xs font-medium">
                    {phoneError}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading || phone.length < 10}
              >
                {loading ? "Sending..." : "Get OTP"}
              </Button>

              {/* Toggle Mode */}
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-sm text-primary hover:underline"
                >
                  {mode === "login"
                    ? "Don't have an account? Sign Up"
                    : "Already have an account? Sign In"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label>Enter OTP</Label>
                <Input
                  type="text"
                  placeholder="XXXXXX"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  maxLength={6}
                  required
                  className="h-11 text-center text-lg tracking-widest"
                />
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? "Verifying..." : "Verify & Login"}
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => setStep("phone")}
              >
                Change Phone Number
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
