"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthHeader, AuthPage, Alert, Field } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier })
      });
      const data = await res.json();
      
      if (res.ok) {
        const target = data.identifier || identifier;
        sessionStorage.setItem("dsr_reset_identifier", target);
        setMessage(data.message || "OTP sent to your registered email.");
        setTimeout(() => {
          router.push(`/verify-otp?identifier=${encodeURIComponent(target)}`);
        }, 800);
      } else {
        setError(data.error || "Unable to send OTP");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPage>
      <AuthHeader title="Forgot Password" description="Enter your registered email to receive a password reset OTP." />
      <form onSubmit={handleSubmit} className="grid gap-4">
        <Field label="Registered Email">
            <input
              type="email"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="name@domain.gov.in"
            />
        </Field>
        {message && <Alert tone="success">{message}</Alert>}
        {error && <Alert tone="error">{error}</Alert>}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Verification Code"}
        </Button>
        <Button className="w-full" type="button" variant="ghost" onClick={() => router.push("/legacy/login.html")}>
          Back to Login
        </Button>
      </form>
    </AuthPage>
  );
}

