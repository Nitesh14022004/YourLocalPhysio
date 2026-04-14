"use client";

import { useSiteContent } from "@/components/SiteContentProvider";
import { trackEvent } from "@/lib/analytics";
import Link from "next/link";

export function Hero() {
  const { content } = useSiteContent();

  return (
    <section className="animate-fade-in-section relative overflow-hidden bg-gradient-to-b from-sky-50 to-white">
      <div className="pointer-events-none absolute -left-24 top-8 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-8 h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {content.heroTitle}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0 lg:text-xl">
              {content.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/book"
                onClick={() => {
                  trackEvent("book_cta_click", { location: "hero" });
                }}
                className="hover-lift inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
              >
                Book Appointment
              </Link>
              <a
                href={`tel:${content.primaryPhone}`}
                onClick={() => {
                  trackEvent("click_to_call", { location: "hero", phone: content.primaryPhone });
                }}
                className="hover-lift inline-flex items-center justify-center rounded-lg border-2 border-blue-600 bg-white px-6 py-3.5 text-base font-semibold text-blue-700 transition-colors hover:bg-blue-50"
              >
                Call: {content.primaryPhone}
              </a>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <div
              className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200/90 px-6 py-8 shadow-inner"
              role="img"
              aria-label="Physiotherapy at home image placeholder"
            >
              <svg
                className="h-14 w-14 shrink-0 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.25}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <p className="max-w-[14rem] text-center text-sm font-medium leading-snug text-slate-500">
                Physiotherapy at home image
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
