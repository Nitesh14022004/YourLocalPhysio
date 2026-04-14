"use client";

import { useSiteContent } from "@/components/SiteContentProvider";
import { trackEvent, trackLead } from "@/lib/analytics";
import { BASE_URL, apiFetch } from "@/lib/api";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

const timeSlots = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
] as const;

type FormErrors = {
  date?: string;
  slot?: string;
  name?: string;
  phone?: string;
  issue?: string;
};

type AppointmentPayload = {
  id: string;
  name: string;
  phone: string;
  issue: string;
  date: string;
  time_slot: string;
};

type BookingSuccess = {
  appointment: AppointmentPayload;
  manageUrl: string;
};

export function BookingForm() {
  const { content } = useSiteContent();
  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [issue, setIssue] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [remainingSlots, setRemainingSlots] = useState<number | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<BookingSuccess | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [leadSource, setLeadSource] = useState("direct:website");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sourceParam = params.get("utm_source") || params.get("source") || "direct";
    const mediumParam = params.get("utm_medium") || "website";
    setLeadSource(`${sourceParam}:${mediumParam}`.slice(0, 80));
  }, []);

  const fetchBookedSlots = async (selectedDate: string, silent = false) => {
    if (!selectedDate) {
      setBookedSlots([]);
      setRemainingSlots(null);
      return;
    }

    if (!silent) {
      setSlotsLoading(true);
      setErrorMessage("");
    }

    try {
      const response = await apiFetch(
        `${BASE_URL}/api/appointments/availability?date=${encodeURIComponent(selectedDate)}`,
      );
      const data = (await response.json().catch(() => null)) as
        | { message?: string; bookedSlots?: unknown; remainingSlots?: unknown }
        | null;

      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch booked slots.");
      }

      const nextSlots = Array.isArray(data?.bookedSlots)
        ? data.bookedSlots.filter((slot): slot is string => typeof slot === "string")
        : [];
      const nextRemainingSlots =
        typeof data?.remainingSlots === "number" && data.remainingSlots >= 0
          ? data.remainingSlots
          : Math.max(timeSlots.length - nextSlots.length, 0);

      setBookedSlots(nextSlots);
      setRemainingSlots(nextRemainingSlots);

      if (selectedSlot && nextSlots.includes(selectedSlot)) {
        setSelectedSlot("");
      }
    } catch (error) {
      setBookedSlots([]);
      setRemainingSlots(null);
      if (!silent) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to fetch booked slots.",
        );
      }
    } finally {
      if (!silent) {
        setSlotsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!date) {
      return;
    }

    const timer = window.setInterval(() => {
      void fetchBookedSlots(date, true);
    }, 20000);

    return () => {
      window.clearInterval(timer);
    };
  }, [date]);

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!date) {
      nextErrors.date = "Please choose a visit date.";
    }

    if (!selectedSlot) {
      nextErrors.slot = "Please select an available time slot.";
    }

    if (!name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (!phone.trim()) {
      nextErrors.phone = "Phone number is required.";
    }

    if (!issue.trim()) {
      nextErrors.issue = "Tell us a little about your issue.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    setErrorMessage("");

    if (!validate()) {
      return;
    }

    if (bookedSlots.includes(selectedSlot)) {
      setErrors((current) => ({ ...current, slot: "Selected slot is already booked." }));
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch(`${BASE_URL}/api/appointments`, {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          issue: issue.trim(),
          date,
          time_slot: selectedSlot,
          source: leadSource,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | {
            message?: string;
            appointment?: AppointmentPayload;
            manage?: { url?: string };
          }
        | null;

      if (!response.ok) {
        throw new Error(data?.message || "Failed to book appointment.");
      }

      const appointment = data?.appointment;
      if (!appointment) {
        throw new Error("Appointment booked but confirmation payload is incomplete.");
      }

      const manageUrl = typeof data?.manage?.url === "string" ? data.manage.url : "";

      setSuccess({ appointment, manageUrl });
      trackLead(leadSource, "booking_form");
      trackEvent("booking_submitted", {
        source: leadSource,
        date: appointment.date,
        time_slot: appointment.time_slot,
      });
      setErrors({});
      setDate("");
      setSelectedSlot("");
      setName("");
      setPhone("");
      setIssue("");
      setBookedSlots([]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to book appointment.");
    } finally {
      setLoading(false);
    }
  };

  const whatsappConfirmationUrl = useMemo(() => {
    if (!success) {
      return "";
    }

    const message = [
      `Hi, I booked a physiotherapy appointment.`,
      `Name: ${success.appointment.name}`,
      `Date: ${success.appointment.date}`,
      `Time: ${success.appointment.time_slot}`,
      success.manageUrl ? `Manage booking: ${success.manageUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    return `https://wa.me/${content.whatsappNumber}?text=${encodeURIComponent(message)}`;
  }, [content.whatsappNumber, success]);

  if (success) {
    return (
      <section className="rounded-xl bg-white p-6 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200 sm:p-8">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Confirmed</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Booking Confirmed</h2>
            <p className="mt-2 text-sm text-slate-600">
              Your appointment is booked. Save your manage link to reschedule or cancel anytime.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <p><span className="font-semibold">Name:</span> {success.appointment.name}</p>
            <p><span className="font-semibold">Date:</span> {success.appointment.date}</p>
            <p><span className="font-semibold">Time:</span> {success.appointment.time_slot}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {success.manageUrl ? (
              <a
                href={success.manageUrl}
                onClick={() => {
                  trackEvent("manage_link_click", { location: "booking_confirmation" });
                }}
                className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
              >
                Manage / Reschedule / Cancel
              </a>
            ) : null}

            <a
              href={whatsappConfirmationUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackEvent("whatsapp_click", { location: "booking_confirmation" });
              }}
              className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              Send Confirmation on WhatsApp
            </a>
          </div>

          <button
            type="button"
            onClick={() => {
              setSuccess(null);
            }}
            className="inline-flex rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Book Another Appointment
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200 sm:p-8">
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label htmlFor="visit-date" className="block text-sm font-medium text-slate-700">
            Visit date
          </label>
          <input
            id="visit-date"
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={date}
            onChange={(event) => {
              const nextDate = event.target.value;
              setDate(nextDate);
              setSelectedSlot("");
              setSuccess(null);
              if (errors.date) {
                setErrors((current) => ({ ...current, date: undefined }));
              }

              void fetchBookedSlots(nextDate);
            }}
            className={`w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${errors.date ? "border-red-300" : "border-slate-300"}`}
          />
          {errors.date ? <p className="text-sm text-red-600">{errors.date}</p> : null}
        </div>

        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-medium text-slate-700">Preferred time slot</h2>
            <p className="mt-1 text-sm text-slate-500">Choose one available slot for your home visit.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {timeSlots.map((slot) => {
              const unavailable = bookedSlots.includes(slot);
              const selected = selectedSlot === slot;

              return (
                <button
                  key={slot}
                  type="button"
                  disabled={unavailable || slotsLoading}
                  onClick={() => {
                    setSelectedSlot(slot);
                    setSuccess(null);
                    if (errors.slot) {
                      setErrors((current) => ({ ...current, slot: undefined }));
                    }
                  }}
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

          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            {remainingSlots === 1 ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 font-semibold text-amber-700">
                Last slot left for selected date
              </span>
            ) : null}
            {typeof remainingSlots === "number" ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 font-semibold text-blue-700">
                {remainingSlots} slots available
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-600" /> Selected
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-300" /> Unavailable
            </span>
          </div>

          {errors.slot ? <p className="text-sm text-red-600">{errors.slot}</p> : null}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (errors.name) {
                  setErrors((current) => ({ ...current, name: undefined }));
                }
              }}
              className={`w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${errors.name ? "border-red-300" : "border-slate-300"}`}
              placeholder="Your full name"
            />
            {errors.name ? <p className="text-sm text-red-600">{errors.name}</p> : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                if (errors.phone) {
                  setErrors((current) => ({ ...current, phone: undefined }));
                }
              }}
              className={`w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${errors.phone ? "border-red-300" : "border-slate-300"}`}
              placeholder="Phone number"
            />
            {errors.phone ? <p className="text-sm text-red-600">{errors.phone}</p> : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="issue" className="block text-sm font-medium text-slate-700">
              Issue
            </label>
            <textarea
              id="issue"
              rows={4}
              value={issue}
              onChange={(event) => {
                setIssue(event.target.value);
                if (errors.issue) {
                  setErrors((current) => ({ ...current, issue: undefined }));
                }
              }}
              className={`w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${errors.issue ? "border-red-300" : "border-slate-300"}`}
              placeholder="Tell us about your pain, mobility concerns, or recovery goals"
            />
            {errors.issue ? <p className="text-sm text-red-600">{errors.issue}</p> : null}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || slotsLoading}
          className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {loading ? "Booking..." : "Book Appointment"}
        </button>

        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      </form>
    </section>
  );
}