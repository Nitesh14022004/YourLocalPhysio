"use client";

import { BASE_URL, apiFetch } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

type ReviewStatus = "pending" | "approved" | "rejected";

type AdminReview = {
  id: string;
  name: string;
  rating: number;
  message: string;
  source: string;
  status: ReviewStatus;
  created_at: string;
};

const statusOptions: ReviewStatus[] = ["pending", "approved", "rejected"];

export function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await apiFetch(`${BASE_URL}/api/admin/reviews`, { method: "GET" });
        const data = (await response.json().catch(() => null)) as { reviews?: unknown; message?: string } | null;

        if (!response.ok || !Array.isArray(data?.reviews)) {
          throw new Error(data?.message || "Failed to load reviews.");
        }

        const normalized = data.reviews
          .map((review) => {
            const id = typeof review?.id === "string" ? review.id : "";
            const name = typeof review?.name === "string" ? review.name : "";
            const ratingRaw = typeof review?.rating === "number" ? review.rating : Number(review?.rating);
            const message = typeof review?.message === "string" ? review.message : "";
            const source = typeof review?.source === "string" ? review.source : "website";
            const status = typeof review?.status === "string" ? review.status : "pending";
            const created_at = typeof review?.created_at === "string" ? review.created_at : "";

            if (!id || !name || !message || Number.isNaN(ratingRaw) || !statusOptions.includes(status as ReviewStatus)) {
              return null;
            }

            return {
              id,
              name,
              rating: Math.max(1, Math.min(5, Math.trunc(ratingRaw))),
              message,
              source,
              status: status as ReviewStatus,
              created_at,
            };
          })
          .filter((review): review is AdminReview => review !== null);

        setReviews(normalized);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load reviews.");
      } finally {
        setLoading(false);
      }
    };

    void loadReviews();
  }, []);

  const pendingCount = useMemo(() => reviews.filter((review) => review.status === "pending").length, [reviews]);

  const updateReviewStatus = async (id: string, status: ReviewStatus) => {
    setLoadingId(id);
    setErrorMessage("");

    const previousReviews = reviews;
    setReviews((current) => current.map((review) => (review.id === id ? { ...review, status } : review)));

    try {
      const response = await apiFetch(`${BASE_URL}/api/admin/reviews/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(data?.message || "Failed to update review");
      }
    } catch (error) {
      setReviews(previousReviews);
      setErrorMessage(error instanceof Error ? error.message : "Failed to update review");
    } finally {
      setLoadingId(null);
    }
  };

  const deleteReview = async (id: string, name: string) => {
    const shouldDelete = window.confirm(`Delete review from ${name}?`);
    if (!shouldDelete) {
      return;
    }

    setLoadingId(id);
    setErrorMessage("");

    const previousReviews = reviews;
    setReviews((current) => current.filter((review) => review.id !== id));

    try {
      const response = await apiFetch(`${BASE_URL}/api/admin/reviews/${id}`, {
        method: "DELETE",
      });

      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete review");
      }
    } catch (error) {
      setReviews(previousReviews);
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete review");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Patient Reviews</h2>
          <p className="mt-1 text-sm text-slate-600">Approve, reject, or remove submitted reviews.</p>
        </div>
        <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
          {pendingCount} pending
        </div>
      </div>

      {errorMessage ? <p className="mb-4 text-sm text-red-600">{errorMessage}</p> : null}

      {loading ? (
        <p className="text-sm text-slate-600">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-slate-500">No reviews submitted yet.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{review.name}</p>
                  <p className="text-xs text-slate-500">{review.rating} star · {review.source}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    aria-label={`Update review status for ${review.name}`}
                    value={review.status}
                    disabled={loadingId === review.id}
                    onChange={(event) => {
                      const nextStatus = event.target.value as ReviewStatus;
                      if (statusOptions.includes(nextStatus)) {
                        void updateReviewStatus(review.id, nextStatus);
                      }
                    }}
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={loadingId === review.id}
                    onClick={() => {
                      void deleteReview(review.id, review.name);
                    }}
                    className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{review.message}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
