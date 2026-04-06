"use client";

import { BASE_URL, apiFetch } from "@/lib/api";
import type { FormEvent } from "react";
import { useState } from "react";

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

export function BookingForm() {
  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [issue, setIssue] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const fetchBookedSlots = async (selectedDate: string) => {
    if (!selectedDate) {
      setBookedSlots([]);
      return;
    }

    setSlotsLoading(true);
    setErrorMessage("");

    try {
      const response = await apiFetch(
        `${BASE_URL}/api/appointments?date=${encodeURIComponent(selectedDate)}`,
      );
      const data = (await response.json().catch(() => null)) as
        | { message?: string; slots?: unknown }
        | null;

      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch booked slots.");
      }

      const nextSlots = Array.isArray(data?.slots)
        ? data.slots.filter((slot): slot is string => typeof slot === "string")
        : [];

      setBookedSlots(nextSlots);

      if (selectedSlot && nextSlots.includes(selectedSlot)) {
        setSelectedSlot("");
      }
    } catch (error) {
      setBookedSlots([]);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to fetch booked slots.",
      );
    } finally {
      setSlotsLoading(false);
    }
  };

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
    setSuccess(false);
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
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.message || "Failed to book appointment.");
      }

      setLoading(false);
      setSuccess(true);
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
              setSuccess(false);
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
                    setSuccess(false);
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
        {success && <p className="text-green-600">Appointment booked successfully</p>}
      </form>
    </section>
  );
}