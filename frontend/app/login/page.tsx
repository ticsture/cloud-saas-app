// app/login/page.tsx

"use client";

import { FormEvent, useState } from "react";
import { apiPost } from "@/lib/api";

interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const data = await apiPost<LoginResponse>("/auth/login", {
        email,
        password,
      });

      // For now, store token in localStorage (simple approach)
      if (typeof window !== "undefined") {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userEmail", data.user.email);
      }

      setSuccess("Logged in successfully!");
      // TODO: later we will redirect to /dashboard
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md bg-slate-900 rounded-xl shadow-xl p-8 border border-slate-800">
        <h1 className="text-2xl font-semibold text-white mb-6 text-center">
          Cloud SaaS Task Manager
        </h1>
        <h2 className="text-lg text-slate-300 mb-4 text-center">
          Sign in to your account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">
              {error}
            </p>
          )}

          {success && (
            <p className="text-sm text-emerald-400">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white py-2 text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-xs text-slate-500 mt-6 text-center">
          Tip: use the same email/password you used with <code>/auth/signup</code> in Postman.
        </p>
      </div>
    </div>
  );
}
