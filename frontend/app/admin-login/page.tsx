"use client";

import React, { useState } from "react";
import { Lock, ShieldAlert, Key, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const [adminKey, setAdminKey] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!adminKey.trim()) {
      setError("Please enter your admin key");
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminKey: adminKey.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Invalid credentials.");
        setLoading(false);
        return;
      }

      // Sync display name & recovery code to localStorage
      if (data.nickname && data.recoveryCode) {
        localStorage.setItem("travel_display_name", data.nickname);
        localStorage.setItem("travel_recovery_code", data.recoveryCode);
        if (data.avatarId) {
          localStorage.setItem("travel_avatar_id", data.avatarId);
        }
        if (data.visitorId) {
          localStorage.setItem("travel_visitor_id", data.visitorId);
        }
      }

      // Redirect directly to admin dashboard
      window.location.href = "/admin";
    } catch (err) {
      console.error(err);
      setError("Connection faded — please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between py-16 px-6 animate-fade-in">
      {/* Header Wordmark */}
      <header className="text-center">
        <a href="/" className="font-display text-2xl tracking-wide text-ink select-none hover:text-amber transition-colors">
          <span className="italic">traveling</span>
          <span className="text-dust mx-1.5">·</span>
          <span className="font-light text-dust text-base uppercase tracking-widest2">planet earth</span>
        </a>
      </header>

      {/* Main card */}
      <main className="max-w-md w-full mx-auto p-8 bg-white border border-ink/5 rounded-sm shadow-md my-8">
        <div className="text-center mb-8">
          <span className="overline text-2xs mb-2">Control Room</span>
          <h1 className="font-display font-bold text-2xl text-ink">Blog Management</h1>
          <div className="amber-line mx-auto mt-3"></div>
        </div>

        {error && (
          <div className="p-3 mb-6 bg-red-50 border-l-2 border-red-500 text-xs text-red-700 font-body flex gap-2 items-center">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Admin Key */}
          <div className="space-y-2">
            <label htmlFor="adminKey" className="block text-xs font-semibold text-ink font-body flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber" />
              <span>Admin Key (XXX-XXX)</span>
            </label>
            <input
              type="text"
              id="adminKey"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="e.g. 522-944"
              autoComplete="off"
              disabled={loading}
              className="w-full px-4 py-2.5 bg-cream/20 border border-ink/10 rounded-sm text-sm font-body text-ink focus:outline-none focus:border-amber/50 transition-colors text-center font-mono tracking-widest uppercase"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-xs font-semibold text-ink font-body flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber" />
              <span>Security Password</span>
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full px-4 py-2.5 bg-cream/20 border border-ink/10 rounded-sm text-sm font-body text-ink focus:outline-none focus:border-amber/50 transition-colors text-center font-mono"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-ink text-cream hover:bg-amber hover:text-white disabled:bg-dust/40 disabled:text-cream font-body text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-sm shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Enter Dashboard</span>
            )}
          </button>
        </form>
      </main>

      {/* Footer */}
      <footer className="text-center text-dust/60 text-2xs font-body">
        <p>Private journal. Access restricted to publisher.</p>
      </footer>
    </div>
  );
}
