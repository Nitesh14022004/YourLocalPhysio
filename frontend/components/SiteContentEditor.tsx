"use client";

import { useSiteContent } from "@/components/SiteContentProvider";
import { fetchSiteContentAdmin, normalizeSiteContent, saveSiteContentAdmin } from "@/lib/siteContent";
import type { SiteContent } from "@/types/siteContent";
import { useEffect, useState } from "react";

export function SiteContentEditor() {
  const { refresh } = useSiteContent();
  const [form, setForm] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const content = await fetchSiteContentAdmin();
        setForm(content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load site content");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const updateField = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const handleSave = async () => {
    if (!form) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const normalized = normalizeSiteContent(form);
      const saved = await saveSiteContentAdmin(normalized);
      setForm(saved);
      await refresh();
      setSuccess("Website content updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save site content");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading website content editor...</p>
      </section>
    );
  }

  if (!form) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="text-sm text-red-700">Unable to load website content.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Website Content</h2>
        <p className="text-sm text-slate-600">
          Update your website name, logo, contact numbers, and testimonials.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Website Name</span>
          <input
            value={form.siteName}
            onChange={(e) => updateField("siteName", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Logo Text</span>
          <input
            value={form.logoText}
            onChange={(e) => updateField("logoText", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Logo Image URL (optional)</span>
          <input
            value={form.logoImageUrl}
            onChange={(e) => updateField("logoImageUrl", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="https://..."
          />
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Hero Title</span>
          <input
            value={form.heroTitle}
            onChange={(e) => updateField("heroTitle", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Hero Subtitle</span>
          <input
            value={form.heroSubtitle}
            onChange={(e) => updateField("heroSubtitle", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Primary Contact Number</span>
          <input
            value={form.primaryPhone}
            onChange={(e) => updateField("primaryPhone", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">WhatsApp Number</span>
          <input
            value={form.whatsappNumber}
            onChange={(e) => updateField("whatsappNumber", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Service Area</span>
          <input
            value={form.serviceArea}
            onChange={(e) => updateField("serviceArea", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </div>

      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Testimonials</h3>
          <button
            type="button"
            onClick={() =>
              updateField("testimonials", [
                ...form.testimonials,
                { name: "", text: "" },
              ])
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Add Testimonial
          </button>
        </div>

        <div className="space-y-4">
          {form.testimonials.map((item, index) => (
            <div key={`testimonial-${index}`} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Testimonial {index + 1}</p>
                <button
                  type="button"
                  onClick={() =>
                    updateField(
                      "testimonials",
                      form.testimonials.filter((_, i) => i !== index),
                    )
                  }
                  className="text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={item.name}
                  onChange={(e) => {
                    const next = [...form.testimonials];
                    next[index] = { ...item, name: e.target.value };
                    updateField("testimonials", next);
                  }}
                  placeholder="Client name"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />

                <textarea
                  value={item.text}
                  onChange={(e) => {
                    const next = [...form.testimonials];
                    next[index] = { ...item, text: e.target.value };
                    updateField("testimonials", next);
                  }}
                  placeholder="Testimonial text"
                  rows={2}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-1"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-green-600">{success}</p> : null}

      <div className="mt-6">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {saving ? "Saving..." : "Save Website Content"}
        </button>
      </div>
    </section>
  );
}
