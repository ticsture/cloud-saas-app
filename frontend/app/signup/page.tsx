"use client";

import { FormEvent, useState } from "react";
import { apiPost } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SignupResponse {
  message: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const data = await apiPost<SignupResponse>("/auth/signup", {
        email,
        password,
        name: name || null,
      });

      setSuccess("Account created successfully! Please log in.");
      
      // Redirect to login after successful signup
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen linear-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--ring)] to-[var(--code-purple)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-semibold text-primary">TaskFlow</span>
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">Create your account</h1>
          <p className="text-secondary">Get started with TaskFlow today</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-primary placeholder-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-colors"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-primary placeholder-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-primary placeholder-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-colors"
                  placeholder="Create a password"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/20">
                <p className="text-sm code-color-red">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-lg bg-[var(--code-green)]/10 border border-[var(--code-green)]/20">
                <p className="text-sm code-color-green">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-base btn-accent text-sm py-3 font-medium transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating account...
                </span>
              ) : (
                "Create account"
              )}
            </button>

            <div className="text-center pt-4 border-t border-[var(--border)]">
              <p className="text-secondary text-sm">
                Already have an account?{" "}
                <Link 
                  href="/login" 
                  className="code-color-blue hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}