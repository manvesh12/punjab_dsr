"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthHeader, AuthPage, Alert, Field } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";

function ResetPasswordContent() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifier = searchParams?.get("identifier") || "";
  const otp = searchParams?.get("otp") || "";

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = calculateStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (strength < 5) {
      setError("Password must be at least 10 characters and include uppercase, lowercase, number and special character.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp, newPassword })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login.html");
        }, 3000);
      } else {
        setError(data.error || "An error occurred");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthPage>
        <AuthHeader title="Success!" tone="success" description="Your password has been reset successfully. Redirecting to login..." />
      </AuthPage>
    );
  }

  return (
    <AuthPage>
      <AuthHeader title="Set New Password" />
      <form onSubmit={handleSubmit} className="grid gap-4">
        <Field
          label="New Password"
          hint={
            newPassword ? (
              <>
                <span className="password-meter" data-strong={strength >= 5}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <span key={level} data-active={strength >= level} />
                  ))}
                </span>
                <span>Use 10+ characters with uppercase, lowercase, number and special character.</span>
              </>
            ) : null
          }
        >
            <input
              type={showPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
        </Field>
        <Field label="Confirm Password">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
        </Field>
        <label className="inline-check">
          <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
          <span>Show password</span>
        </label>
        {error && <Alert tone="error">{error}</Alert>}
        <Button className="w-full" type="submit" disabled={loading || !newPassword || newPassword !== confirmPassword || strength < 5}>
          {loading ? "Resetting..." : "Reset Password"}
        </Button>
      </form>
    </AuthPage>
  );
}

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <AuthPage>
          <AuthHeader title="Loading..." />
        </AuthPage>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

