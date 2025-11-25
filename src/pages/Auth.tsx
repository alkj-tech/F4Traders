import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; // Assuming you have sonner or use your toast lib

export default function AuthPage() {
  const { user, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">("login");
  
  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneError, setPhoneError] = useState(""); // Track validation error
  
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  // --- VALIDATION LOGIC ---
  const validatePhone = (num: string) => {
    // Regex: Starts with 6-9, followed by 9 digits (Total 10)
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    
    if (!num) return "Phone number is required";
    if (num.length !== 10) return "Phone number must be 10 digits";
    if (!indianPhoneRegex.test(num)) return "Invalid Indian mobile number";
    
    return ""; // No error
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Allow only numbers
    const value = e.target.value.replace(/\D/g, "");
    
    // 2. Limit to 10 digits
    if (value.length <= 10) {
      setPhone(value);
      // Clear error as they type (optional)
      if (phoneError) setPhoneError("");
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Run Validation before sending
    const error = validatePhone(phone);
    if (error) {
      setPhoneError(error);
      return; // STOP HERE
    }

    setLoading(true);
    try {
      await sendOtp(phone);
      setStep("otp");
    } catch (error) {
      // Context handles alert
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
      await verifyOtp(phone, otp, mode === "signup" ? name : undefined);
    } catch (error) {
      // Context handles alert
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {step === "phone" 
              ? `Enter your details to ${mode === "login" ? "login" : "register"}` 
              : `Enter the OTP sent to +91 ${phone}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "phone" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="flex gap-2">
                   {/* Prefix Box */}
                   <div className="flex items-center justify-center border rounded-md px-3 bg-gray-100 text-gray-500 font-medium h-11">
                     +91
                   </div>
                   <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={handlePhoneChange} // Uses strict handler
                    className={`h-11 ${phoneError ? "border-red-500" : ""}`}
                  />
                </div>
                {/* Validation Error Text */}
                {phoneError && (
                    <p className="text-red-500 text-xs font-medium">{phoneError}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-11" 
                disabled={loading || phone.length < 10} // Disable if invalid
              >
                {loading ? "Sending..." : "Get OTP"}
              </Button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                      setMode(mode === "login" ? "signup" : "login");
                      setPhoneError(""); 
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {mode === "login" 
                    ? "Don't have an account? Sign Up" 
                    : "Already have an account? Login"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">One-Time Password</Label>
                <Input
                  id="otp"
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
                variant="ghost" 
                className="w-full"
                onClick={() => setStep("phone")}
              >
                Change Phone Number
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}