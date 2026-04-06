"use client";

import { BASE_URL, apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

type AppointmentStatus = "pending" | "confirmed" | "cancelled";

type Appointment = {
  id: string;
  name: string;
  phone: string;
  issue: string | null;
  date: string;
  time_slot: string;
  status: AppointmentStatus | string | null;
  created_at: string | null;
};

const statusOptions: AppointmentStatus[] = ["pending", "confirmed", "cancelled"];

const statusStyles: Record<AppointmentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 ring-yellow-200",
  confirmed: "bg-green-100 text-green-800 ring-green-200",
  cancelled: "bg-red-100 text-red-800 ring-red-200",
};

function isAppointmentStatus(value: string): value is AppointmentStatus {
  return statusOptions.includes(value as AppointmentStatus);
}

function formatStatus(value: Appointment["status"]) {
  if (value && typeof value === "string" && isAppointmentStatus(value)) {
    return value;
  }

  return "pending";
}

export function AdminTable() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const loadAppointments = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await apiFetch(`${BASE_URL}/api/admin/appointments`);
        const data = (await response.json().catch(() => null)) as unknown;

        if (!response.ok) {
          const message =
            data && typeof data === "object" && "message" in data && typeof data.message === "string"
              ? data.message
              : "Failed to load appointments.";
          throw new Error(message);
        }

        if (!Array.isArray(data)) {
          throw new Error("Unexpected appointments response.");
        }

        setAppointments(
          data.map((item) => ({
            ...(item as Appointment),
            status: formatStatus((item as Appointment).status),
          })),
        );
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load appointments.");
      } finally {
        setLoading(false);
      }
    };

    void loadAppointments();
  }, []);

  const updateStatus = async (id: string, nextStatus: AppointmentStatus) => {
    const previousAppointments = appointments;
    setErrorMessage("");
    setLoadingId(id);
    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === id ? { ...appointment, status: nextStatus } : appointment,
      ),
    );

    try {
      const response = await apiFetch(`${BASE_URL}/api/admin/appointments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        const message =
          data && typeof data === "object" && "message" in data && typeof data.message === "string"
            ? data.message
            : "Failed to update appointment.";
        throw new Error(message);
      }

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === id ? ({ ...(data as Appointment), status: nextStatus } as Appointment) : appointment,
        ),
      );
    } catch (error) {
      setAppointments(previousAppointments);
      setErrorMessage(error instanceof Error ? error.message : "Failed to update appointment.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Appointments</h2>
          <p className="mt-1 text-sm text-slate-600">Review and update appointment status in one place.</p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
          {appointments.length} total
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          Loading appointments...
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          No appointments found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Issue
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Time Slot
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {appointments.map((appointment) => {
                const currentStatus = formatStatus(appointment.status);

                return (
                  <tr key={appointment.id} className="align-top hover:bg-slate-50/80">
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">{appointment.name}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{appointment.phone}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{appointment.issue || "-"}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{appointment.date}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{appointment.time_slot}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <span
                          className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyles[currentStatus]}`}
                        >
                          {currentStatus}
                        </span>
                        <select
                          aria-label={`Update status for ${appointment.name}`}
                          value={currentStatus}
                          disabled={loadingId === appointment.id}
                          onChange={(event) => {
                            const nextStatus = event.target.value;
                            if (isAppointmentStatus(nextStatus)) {
                              void updateStatus(appointment.id, nextStatus);
                            }
                          }}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 sm:w-40"
                        >
                          {statusOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
