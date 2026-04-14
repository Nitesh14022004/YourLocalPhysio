"use client";

import { BASE_URL, apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

const ADMIN_TOKEN_KEY = "admin-token";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  useEffect(() => {
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);

    if (!token) {
      return;
    }

    const verifySession = async () => {
      try {
        const response = await apiFetch(`${BASE_URL}/api/admin/session`, {
          method: "GET",
          skipUnauthorizedRedirect: true,
        });

        if (response.ok) {
          router.replace("/admin");
        }
      } catch {
        window.localStorage.removeItem(ADMIN_TOKEN_KEY);
      }
    };

    void verifySession();
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(`${BASE_URL}/api/admin/login`, {
        method: "POST",
        skipUnauthorizedRedirect: true,
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = (await response.json().catch(() => null)) as
        | { success?: boolean; token?: string; message?: string }
        | null;

      if (!response.ok || !data?.success || !data.token) {
        throw new Error(data?.message || "Invalid password");
      }

      window.localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      router.replace("/admin");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Invalid password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
            Admin Access
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Login to Admin
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Enter the admin password to continue.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="Enter admin password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}
