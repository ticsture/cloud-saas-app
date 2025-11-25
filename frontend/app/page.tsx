"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      setIsAuthenticated(!!token);
    }
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/signup");
    }
  };

  return (
    <div className="min-h-screen linear-bg">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--ring)] to-[var(--code-purple)] flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-xl font-semibold text-primary">TaskFlow</span>
        </div>
        
        <div className="flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Link href="/login" className="btn-base text-sm px-4 py-2">
                Log in
              </Link>
              <Link href="/signup" className="btn-base btn-accent text-sm px-4 py-2">
                Sign up
              </Link>
            </>
          ) : (
            <Link href="/dashboard" className="btn-base btn-accent text-sm px-4 py-2">
              Dashboard
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 pill text-xs px-3 py-1">
            <div className="w-2 h-2 rounded-full bg-[var(--code-green)] animate-pulse"></div>
            <span>New: Real-time collaboration</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl font-bold leading-tight tracking-tight">
            <span className="text-primary">The system for</span>
            <br />
            <span className="bg-gradient-to-r from-[var(--ring)] via-[var(--code-purple)] to-[var(--code-green)] bg-clip-text text-transparent">
              modern teams
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-secondary max-w-2xl mx-auto leading-relaxed">
            TaskFlow streamlines work across your entire team. 
            From planning to release, manage projects with precision and clarity.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <button 
              onClick={handleGetStarted}
              className="btn-base btn-accent text-sm px-8 py-3 font-medium transition-all hover:scale-105"
            >
              {isAuthenticated ? "Go to Dashboard" : "Get started for free"}
            </button>
            <Link 
              href="#features"
              className="btn-base text-sm px-8 py-3 transition-all hover:scale-105"
            >
              Learn more
            </Link>
          </div>

          {/* Social Proof */}
          <div className="pt-12 text-faint">
            <p className="text-sm mb-4">Trusted by teams at</p>
            <div className="flex items-center justify-center gap-8 opacity-60">
              <span className="text-sm font-medium">Startup</span>
              <span className="text-sm font-medium">TechCorp</span>
              <span className="text-sm font-medium">Innovation Labs</span>
              <span className="text-sm font-medium">DevStudio</span>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">Built for productivity</h2>
            <p className="text-secondary text-lg">Everything you need to ship faster</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-8 text-center">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--code-blue)] to-[var(--ring)] mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-lg">📋</span>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-3">Task Management</h3>
              <p className="text-secondary">Organize work with boards, lists, and powerful filters. Stay on top of deadlines.</p>
            </div>

            <div className="card p-8 text-center">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--code-green)] to-[var(--code-yellow)] mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-lg">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-3">Team Collaboration</h3>
              <p className="text-secondary">Work together seamlessly with real-time updates and shared workspaces.</p>
            </div>

            <div className="card p-8 text-center">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--code-purple)] to-[var(--code-red)] mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-lg">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-3">Analytics</h3>
              <p className="text-secondary">Track progress and identify bottlenecks with detailed insights.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-6 py-12">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--ring)] to-[var(--code-purple)] flex items-center justify-center">
              <span className="text-white font-bold text-xs">T</span>
            </div>
            <span className="font-semibold text-primary">TaskFlow</span>
          </div>
          <p className="text-faint text-sm">
            Built with ❤️ for modern teams
          </p>
        </div>
      </footer>
    </div>
  );
}
