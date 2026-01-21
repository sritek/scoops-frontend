"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Phone, ArrowLeft, CheckCircle } from "lucide-react";

import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui";
import { useParentAuth } from "@/lib/auth";

type Step = "phone" | "otp";

/**
 * Parent Login Form Component
 *
 * OTP-based authentication flow:
 * 1. Enter phone number
 * 2. Receive OTP via WhatsApp
 * 3. Enter 6-digit OTP
 * 4. Redirect to dashboard
 */
export function ParentLoginForm() {
  const router = useRouter();
  const { requestOTP, verifyOTP, isLoading: authLoading } = useParentAuth();

  // Step state
  const [step, setStep] = useState<Step>("phone");

  // Phone input state
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // OTP input state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Ref to track if OTP submission is in progress (prevents double submission)
  const isSubmittingRef = useRef(false);

  // Loading and cooldown states
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle phone validation
  const validatePhone = (value: string): boolean => {
    // Remove any non-digit characters for validation
    const digits = value.replace(/\D/g, "");
    return digits.length >= 10;
  };

  // Handle phone submission
  const handlePhoneSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setPhoneError(null);

      if (!validatePhone(phone)) {
        setPhoneError("Please enter a valid 10-digit phone number");
        return;
      }

      setIsLoading(true);

      try {
        const result = await requestOTP(phone);

        if (result.success) {
          setSuccessMessage("OTP sent to your WhatsApp");
          setStep("otp");
          // Focus first OTP input
          setTimeout(() => {
            otpInputRefs.current[0]?.focus();
          }, 100);
        } else {
          if (result.cooldownSeconds) {
            setCooldown(result.cooldownSeconds);
          }
          setPhoneError(result.message);
        }
      } catch (err) {
        console.error("OTP request error:", err);
        setPhoneError("Failed to send OTP. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [phone, requestOTP]
  );

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];

    // Handle paste - distribute digits across inputs
    if (value.length > 1) {
      const digits = value.slice(0, 6).split("");
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      // Focus next empty input or last input
      const nextIndex = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP keydown for backspace
  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle OTP submission
  const handleOtpSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Prevent double submission
      if (isSubmittingRef.current) return;

      setOtpError(null);

      const otpValue = otp.join("");
      if (otpValue.length !== 6) {
        setOtpError("Please enter the complete 6-digit OTP");
        return;
      }

      isSubmittingRef.current = true;
      setIsLoading(true);

      try {
        const result = await verifyOTP(phone, otpValue);

        if (result.success) {
          setSuccessMessage("Login successful! Redirecting...");
          setTimeout(() => {
            router.push("/parent");
          }, 500);
        } else {
          setOtpError(result.message);
          // Clear OTP on error
          setOtp(["", "", "", "", "", ""]);
          otpInputRefs.current[0]?.focus();
        }
      } catch (err) {
        console.error("OTP verification error:", err);
        setOtpError("Failed to verify OTP. Please try again.");
      } finally {
        setIsLoading(false);
        isSubmittingRef.current = false;
      }
    },
    [otp, phone, verifyOTP, router]
  );

  // Combined loading state (local + auth context)
  const effectiveLoading = isLoading || authLoading;

  // Auto-submit when OTP is complete
  useEffect(() => {
    const otpValue = otp.join("");
    // Check effectiveLoading and isSubmittingRef to prevent double submission
    if (otpValue.length === 6 && !effectiveLoading && !isSubmittingRef.current) {
      // Small delay to show the filled state
      const timer = setTimeout(() => {
        const form = document.getElementById("otp-form") as HTMLFormElement;
        form?.requestSubmit();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [otp, effectiveLoading]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  // Resend OTP
  const handleResendOTP = useCallback(async () => {
    if (cooldown > 0 || isLoading) return;

    setIsLoading(true);
    setOtpError(null);

    try {
      const result = await requestOTP(phone);

      if (result.success) {
        setSuccessMessage("New OTP sent!");
        setCooldown(60); // 60 second cooldown
        // Clear OTP
        setOtp(["", "", "", "", "", ""]);
        otpInputRefs.current[0]?.focus();
      } else {
        if (result.cooldownSeconds) {
          setCooldown(result.cooldownSeconds);
        }
        setOtpError(result.message);
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      setOtpError("Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [phone, cooldown, isLoading, requestOTP]);

  // Go back to phone step
  const handleBackToPhone = () => {
    setStep("phone");
    setOtp(["", "", "", "", "", ""]);
    setOtpError(null);
    setSuccessMessage(null);
  };

  return (
    <Card className="w-full max-w-sm">
      {step === "phone" ? (
        <>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              <Phone className="h-6 w-6 text-primary-600" aria-hidden="true" />
            </div>
            <CardTitle>Welcome, Parent</CardTitle>
            <CardDescription>
              Enter your registered phone number to continue
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Success message */}
            {successMessage && (
              <div
                className="mb-4 flex items-center gap-2 rounded-sm border border-green-200 bg-green-50 p-3 text-sm text-green-700"
                role="status"
              >
                <CheckCircle className="h-4 w-4" />
                {successMessage}
              </div>
            )}

            {/* Error message */}
            {phoneError && (
              <div
                className="mb-4 rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-error"
                role="alert"
              >
                {phoneError}
              </div>
            )}

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" required>
                  Phone Number
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">
                    +91
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    autoComplete="tel"
                    disabled={effectiveLoading}
                    className="pl-12"
                    value={phone}
                    onChange={(e) => {
                      // Only allow digits
                      const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setPhone(value);
                    }}
                    error={phoneError ?? undefined}
                    aria-describedby={phoneError ? "phone-error" : undefined}
                  />
                </div>
                <p className="text-xs text-text-muted">
                  OTP will be sent to your WhatsApp
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={effectiveLoading || cooldown > 0}
                isLoading={effectiveLoading}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Get OTP"}
              </Button>
            </form>
          </CardContent>
        </>
      ) : (
        <>
          <CardHeader className="text-center">
            <button
              type="button"
              onClick={handleBackToPhone}
              className="absolute left-4 top-4 p-2 text-text-muted hover:text-text-primary transition-colors rounded-sm hover:bg-bg-app"
              aria-label="Go back to phone number"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              <Phone className="h-6 w-6 text-primary-600" aria-hidden="true" />
            </div>
            <CardTitle>Enter OTP</CardTitle>
            <CardDescription>
              We sent a 6-digit code to +91 {phone}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Success message */}
            {successMessage && (
              <div
                className="mb-4 flex items-center gap-2 rounded-sm border border-green-200 bg-green-50 p-3 text-sm text-green-700"
                role="status"
              >
                <CheckCircle className="h-4 w-4" />
                {successMessage}
              </div>
            )}

            {/* Error message */}
            {otpError && (
              <div
                className="mb-4 rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-error"
                role="alert"
              >
                {otpError}
              </div>
            )}

            <form id="otp-form" onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label required>OTP Code</Label>
                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      disabled={effectiveLoading}
                      className="w-10 h-12 text-center text-lg font-semibold px-0"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      aria-label={`OTP digit ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={effectiveLoading || otp.join("").length !== 6}
                isLoading={effectiveLoading}
              >
                Verify OTP
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={cooldown > 0 || effectiveLoading}
                  className="text-sm text-text-muted hover:text-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          </CardContent>
        </>
      )}
    </Card>
  );
}
