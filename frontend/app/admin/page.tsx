"use client";

import { AdminInsights } from "@/components/AdminInsights";
import { AdminTable } from "@/components/AdminTable";
import { Navbar } from "@/components/Navbar";
import { SiteContentEditor } from "@/components/SiteContentEditor";
import { BASE_URL, apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
const ADMIN_TOKEN_KEY = "admin-token";

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    const verifySession = async () => {
      try {
        const response = await apiFetch(`${BASE_URL}/api/admin/session`, {
          method: "GET",
          skipUnauthorizedRedirect: true,
        });

        if (!response.ok) {
          window.localStorage.removeItem(ADMIN_TOKEN_KEY);
          router.replace("/admin/login");
          return;
        }

        setAuthorized(true);
      } catch {
        window.localStorage.removeItem(ADMIN_TOKEN_KEY);
        router.replace("/admin/login");
      } finally {
        setCheckingSession(false);
      }
    };

    void verifySession();
  }, [router]);

  if (!authorized || checkingSession) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <button
              type="button"
              onClick={() => {
                window.localStorage.removeItem(ADMIN_TOKEN_KEY);
                router.replace("/admin/login");
              }}
              className="rounded-md border px-3 py-1 text-sm transition hover:bg-slate-100"
            >
              Logout
            </button>
          </div>

          <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Review all bookings, check appointment details, and update each status as needed.
          </p>

          <SiteContentEditor />

          <AdminInsights />

          <AdminTable />
        </div>
      </main>
    </>
  );
}
