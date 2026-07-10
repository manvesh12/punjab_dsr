"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded shadow-md">
        <h2 className="text-2xl font-bold mb-2 text-center">Forgot Password</h2>
        <p className="text-sm text-gray-600 mb-6 text-center">Enter your registered email to receive a password reset OTP.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Registered Email</label>
            <input
              type="email"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="name@domain.gov.in"
            />
          </div>
          {message && <div className="text-sm text-green-600 bg-green-50 p-2 rounded">{message}</div>}
          {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Verification Code"}
          </button>
          <button type="button" onClick={() => router.push("/legacy/login.html")} className="w-full text-sm text-blue-800 hover:underline">
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}
