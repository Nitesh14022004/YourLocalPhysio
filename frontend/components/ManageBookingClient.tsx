"use client";

import { Navbar } from "@/components/Navbar";
import { trackEvent } from "@/lib/analytics";
import { BASE_URL } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

const timeSlots = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
] as const;

type ManagedAppointment = {
  id: string;
  name: string;
  phone: string;
  issue: string | null;
  date: string;
  time_slot: string;
  status: string | null;
};

export function ManageBookingClient({ token }: { token: string }) {
  const [appointment, setAppointment] = useState<ManagedAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchAvailability = async (date: string) => {
    if (!date) {
      setBookedSlots([]);
      return;
    }

    setSlotsLoading(true);

    try {
      const response = await fetch(
        `${BASE_URL}/api/appointments/availability?date=${encodeURIComponent(date)}`,
      );
      const data = (await response.json().catch(() => null)) as
        | { message?: string; bookedSlots?: unknown }
        | null;

      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch availability");
      }

      const nextBookedSlots = Array.isArray(data?.bookedSlots)
        ? data.bookedSlots.filter((slot): slot is string => typeof slot === "string")
        : [];

      setBookedSlots(nextBookedSlots);
    } catch (error) {
      setBookedSlots([]);
      setErrorMessage(error instanceof Error ? error.message : "Failed to fetch availability");
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    const loadAppointment = async () => {
      if (!token) {
        setErrorMessage("Missing booking token.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(`${BASE_URL}/api/appointments/manage?token=${encodeURIComponent(token)}`);
        const data = (await response.json().catch(() => null)) as
          | { message?: string; appointment?: ManagedAppointment }
          | null;

        if (!response.ok || !data?.appointment) {
          throw new Error(data?.message || "Invalid or expired manage link.");
        }

        setAppointment(data.appointment);
        setSelectedDate(data.appointment.date);
        setSelectedSlot(data.appointment.time_slot);
        await fetchAvailability(data.appointment.date);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load booking.");
      } finally {
        setLoading(false);
      }
    };

    void loadAppointment();
  }, [token]);

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    const timer = window.setInterval(() => {
      void fetchAvailability(selectedDate);
    }, 20000);

    return () => {
      window.clearInterval(timer);
    };
  }, [selectedDate]);

  const canReschedule = useMemo(() => {
    if (!appointment) {
      return false;
    }

    return Boolean(selectedDate && selectedSlot) && (
      selectedDate !== appointment.date || selectedSlot !== appointment.time_slot
    );
  }, [appointment, selectedDate, selectedSlot]);

  const handleReschedule = async () => {
    if (!token || !selectedDate || !selectedSlot) {
      return;
    }

    setActionLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`${BASE_URL}/api/appointments/reschedule`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          date: selectedDate,
          time_slot: selectedSlot,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { message?: string; appointment?: ManagedAppointment }
        | null;

      if (!response.ok || !data?.appointment) {
        throw new Error(data?.message || "Failed to reschedule appointment.");
      }

      setAppointment(data.appointment);
      setSuccessMessage("Appointment rescheduled successfully.");
      trackEvent("booking_rescheduled", {
        date: data.appointment.date,
        time_slot: data.appointment.time_slot,
      });
      await fetchAvailability(selectedDate);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to reschedule appointment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!token) {
      return;
    }

    const shouldCancel = window.confirm("Are you sure you want to cancel this appointment?");
    if (!shouldCancel) {
      return;
    }

    setActionLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`${BASE_URL}/api/appointments/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(data?.message || "Failed to cancel appointment.");
      }

      setAppointment(null);
      setSuccessMessage("Your appointment has been cancelled.");
      trackEvent("booking_cancelled", { location: "manage_booking_page" });
      setBookedSlots([]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to cancel appointment.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Manage Booking</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Reschedule or cancel your visit</h1>
            <p className="text-base leading-7 text-slate-600 sm:text-lg">
              Use your secure booking link to make changes without calling support.
            </p>
          </div>

          <section className="rounded-xl bg-white p-6 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200 sm:p-8">
            {loading ? <p className="text-sm text-slate-600">Loading your booking details...</p> : null}

            {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
            {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}

            {!loading && appointment ? (
              <div className="space-y-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <p><span className="font-semibold">Name:</span> {appointment.name}</p>
                  <p><span className="font-semibold">Current Date:</span> {appointment.date}</p>
                  <p><span className="font-semibold">Current Time:</span> {appointment.time_slot}</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="reschedule-date" className="block text-sm font-medium text-slate-700">
                    New date
                  </label>
                  <input
                    id="reschedule-date"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={selectedDate}
                    onChange={(event) => {
                      const nextDate = event.target.value;
                      setSelectedDate(nextDate);
                      setSelectedSlot("");
                      void fetchAvailability(nextDate);
                    }}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700">New time slot</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {timeSlots.map((slot) => {
                      const unavailable = bookedSlots.includes(slot) && !(selectedDate === appointment.date && slot === appointment.time_slot);
                      const selected = selectedSlot === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={unavailable || slotsLoading || actionLoading}
                          onClick={() => setSelectedSlot(slot)}
                          className={`rounded-lg border px-3 py-3 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                            unavailable
                              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                              : selected
                                ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                                : "border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={!canReschedule || actionLoading}
                    onClick={() => {
                      void handleReschedule();
                    }}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                  >
                    {actionLoading ? "Updating..." : "Reschedule Appointment"}
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => {
                      void handleCancel();
                    }}
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Cancel Appointment
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </>
  );
}
