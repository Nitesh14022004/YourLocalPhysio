"use client";

import { AdminTable } from "@/components/AdminTable";
import { Navbar } from "@/components/Navbar";
import { useEffect, useState } from "react";
const ADMIN_TOKEN_KEY = "admin-token";

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);

    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    setAuthorized(true);
  }, []);

  if (!authorized) {
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
                window.location.href = "/admin/login";
              }}
              className="rounded-md border px-3 py-1 text-sm transition hover:bg-slate-100"
            >
              Logout
            </button>
          </div>

          <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Review all bookings, check appointment details, and update each status as needed.
          </p>

          <AdminTable />
        </div>
      </main>
    </>
  );
}
