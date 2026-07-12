"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthHeader, AuthPage, Alert, Field } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";

function VerifyOtpContent() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState(600); // 10 minutes
  const [cooldown, setCooldown] = useState(60);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifier = searchParams?.get("identifier") || "";

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
      setCooldown((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp })
      });
      const data = await res.json();
      
      if (res.ok) {
        router.push(`/reset-password?identifier=${encodeURIComponent(identifier)}&otp=${encodeURIComponent(otp)}`);
      } else {
        setError(data.error || "An error occurred");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/auth/forgot-password/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier })
      });
      const data = await res.json();
      if (res.ok) {
        setTimer(data.expiresInSeconds || 600);
        setCooldown(data.resendCooldownSeconds || 60);
        setMessage(data.message || "Fresh OTP sent to your registered email.");
      } else {
        setError(data.error || "Unable to resend OTP");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  return (
    <AuthPage>
      <AuthHeader
        title="Verify OTP"
        description={
          identifier
            ? `Code sent to ${identifier}. Expires in ${minutes}:${seconds < 10 ? `0${seconds}` : seconds}.`
            : `Code expires in ${minutes}:${seconds < 10 ? `0${seconds}` : seconds}.`
        }
      />
      <form onSubmit={handleSubmit} className="grid gap-4">
        <Field label="6-Digit OTP">
          <input
            type="text"
            required
            maxLength={6}
            className="text-center text-lg tracking-widest"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
          />
        </Field>
        {message && <Alert tone="success">{message}</Alert>}
        {error && <Alert tone="error">{error}</Alert>}
        <Button className="w-full" type="submit" disabled={loading || otp.length !== 6 || timer === 0}>
          {loading ? "Verifying..." : "Verify OTP"}
        </Button>
        <Button className="w-full" type="button" variant="outline" disabled={resending || cooldown > 0} onClick={handleResend}>
          {resending ? "Sending..." : cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
        </Button>
        <Button className="w-full" type="button" variant="ghost" onClick={() => router.push("/legacy/login.html")}>
          Back to Login
        </Button>
      </form>
    </AuthPage>
  );
}

export default function VerifyOtp() {
  return (
    <Suspense
      fallback={
        <AuthPage>
          <AuthHeader title="Loading..." />
        </AuthPage>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}

