"use client";

import { ReviewForm } from "@/components/ReviewForm";
import { useSiteContent } from "@/components/SiteContentProvider";
import { BASE_URL } from "@/lib/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PublicReview = {
  id: string;
  name: string;
  rating: number;
  message: string;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`h-5 w-5 shrink-0 ${i < rating ? "text-amber-400" : "text-slate-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function Testimonials() {
  const { content } = useSiteContent();
  const [approvedReviews, setApprovedReviews] = useState<PublicReview[]>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/reviews`, { cache: "no-store" });
        const data = (await response.json().catch(() => null)) as { reviews?: unknown } | null;

        if (!response.ok || !Array.isArray(data?.reviews)) {
          return;
        }

        const normalized = data.reviews
          .map((review) => {
            const id = typeof review?.id === "string" ? review.id : "";
            const name = typeof review?.name === "string" ? review.name : "";
            const rating = typeof review?.rating === "number" ? review.rating : Number(review?.rating);
            const message = typeof review?.message === "string" ? review.message : "";

            if (!id || !name || !message || Number.isNaN(rating)) {
              return null;
            }

            return {
              id,
              name,
              rating: Math.max(1, Math.min(5, Math.trunc(rating))),
              message,
            };
          })
          .filter((review): review is PublicReview => review !== null);

        setApprovedReviews(normalized);
      } catch {
        setApprovedReviews([]);
      }
    };

    void loadReviews();
  }, []);

  const reviewsToRender = useMemo(() => {
    if (approvedReviews.length > 0) {
      return approvedReviews.map((review) => ({
        id: review.id,
        name: review.name,
        text: review.message,
        rating: review.rating,
      }));
    }

    return content.testimonials.map((item, index) => ({
      id: `fallback-${index}`,
      name: item.name,
      text: item.text,
      rating: 5,
    }));
  }, [approvedReviews, content.testimonials]);

  const scrollByDirection = useCallback((direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-testimonial-card]");
    const gap = 24;
    const step = card ? card.offsetWidth + gap : Math.round(el.clientWidth * 0.35);
    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  }, []);

  return (
    <div className="home-section home-testimonials animate-fade-in-section bg-gradient-to-b from-white to-sky-50/40 py-16 md:py-20">
      <div className="home-section-inner mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-slate-900 md:text-4xl">
          Testimonials
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-500">
          What our patients say about care at home.
        </p>

        <div className="home-testimonials-row mt-10 flex items-center gap-3 sm:mt-12 sm:gap-4">
          <button
            type="button"
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 md:flex"
            aria-label="Scroll testimonials left"
            onClick={() => scrollByDirection("left")}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div
            ref={scrollerRef}
            className="home-testimonials-scroller flex min-w-0 flex-1 snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 sm:gap-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {reviewsToRender.map((item) => (
              <article
                key={item.id}
                data-testimonial-card
                className="flex w-[min(82vw,320px)] shrink-0 snap-start flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 md:w-[calc((100%-3rem)/3.15)]"
              >
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                  &ldquo;{item.text}&rdquo;
                </p>
                <div className="mt-4">
                  <StarRating rating={item.rating} />
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 md:flex"
            aria-label="Scroll testimonials right"
            onClick={() => scrollByDirection("right")}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <ReviewForm />
        </div>
      </div>
    </div>
  );
}
