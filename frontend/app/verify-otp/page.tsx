"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Verify OTP</h2>
        <p className="text-sm text-gray-600 mb-4 text-center">
          Code sent to <strong>{identifier}</strong>. Expires in {minutes}:{seconds < 10 ? `0${seconds}` : seconds}.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">6-Digit OTP</label>
            <input
              type="text"
              required
              maxLength={6}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-center text-lg tracking-widest"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
            />
          </div>
          {message && <div className="text-sm text-green-600 bg-green-50 p-2 rounded">{message}</div>}
          {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
          <button
            type="submit"
            disabled={loading || otp.length !== 6 || timer === 0}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          <button
            type="button"
            disabled={resending || cooldown > 0}
            onClick={handleResend}
            className="w-full flex justify-center py-2 px-4 border border-blue-900 rounded-md text-sm font-medium text-blue-900 hover:bg-blue-50 disabled:opacity-50"
          >
            {resending ? "Sending..." : cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
          </button>
          <button type="button" onClick={() => router.push("/legacy/login.html")} className="w-full text-sm text-blue-800 hover:underline">
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default function VerifyOtp() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
