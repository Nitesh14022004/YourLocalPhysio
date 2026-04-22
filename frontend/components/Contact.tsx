"use client";

import { useSiteContent } from "@/components/SiteContentProvider";
import { trackEvent } from "@/lib/analytics";
import Link from "next/link";

export function Contact() {
  const { content } = useSiteContent();

  return (
    <section className="home-section home-contact animate-fade-in-section bg-gradient-to-b from-sky-50/60 to-white py-16 md:py-24">
      <div className="home-section-inner mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-3xl border border-sky-100 bg-white p-5 shadow-lg shadow-slate-200/60 sm:p-8 md:p-10">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Contact
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Ready for Your Home Visit?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-600">
              We provide physiotherapy home visits across Bangalore with focused care for pain
              relief, recovery, and mobility.
            </p>
          </div>

          <div className="home-contact-actions mt-8 grid gap-4 sm:grid-cols-2">
            <a
              href={`tel:${content.primaryPhone}`}
              onClick={() => {
                trackEvent("click_to_call", { location: "contact", phone: content.primaryPhone });
              }}
              className="hover-lift inline-flex w-full items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
            >
              Call: {content.primaryPhone}
            </a>

            <a
              href={`https://wa.me/${content.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackEvent("whatsapp_click", { location: "contact", number: content.whatsappNumber });
              }}
              className="hover-lift inline-flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              Chat on WhatsApp
            </a>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-700">
            Service area: {content.serviceArea}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/book"
              onClick={() => {
                trackEvent("book_cta_click", { location: "contact" });
              }}
              className="hover-lift inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
