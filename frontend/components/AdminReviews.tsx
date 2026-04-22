"use client";

import { BASE_URL, apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

type AdminReview = {
  id: string;
  name: string;
  rating: number;
  message: string;
  source: string;
  created_at: string;
};

type EditingReview = {
  id: string;
  name: string;
  rating: number;
  message: string;
};

export function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<EditingReview | null>(null);

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
            const created_at = typeof review?.created_at === "string" ? review.created_at : "";

            if (!id || !name || !message || Number.isNaN(ratingRaw)) {
              return null;
            }

            return {
              id,
              name,
              rating: Math.max(1, Math.min(5, Math.trunc(ratingRaw))),
              message,
              source,
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

  const updateReview = async () => {
    if (!editingReview) return;

    setLoadingId(editingReview.id);
    setErrorMessage("");

    const previousReviews = reviews;

    try {
      const response = await apiFetch(`${BASE_URL}/api/admin/reviews/${editingReview.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editingReview.name,
          rating: editingReview.rating,
          message: editingReview.message,
        }),
      });

      const data = (await response.json().catch(() => null)) as { review?: unknown; message?: string } | null;

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update review");
      }

      setReviews((current) =>
        current.map((review) =>
          review.id === editingReview.id
            ? {
                ...review,
                name: editingReview.name,
                rating: editingReview.rating,
                message: editingReview.message,
              }
            : review,
        ),
      );

      setEditingReview(null);
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
      <div className="mb-5">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Patient Reviews</h2>
        <p className="mt-1 text-sm text-slate-600">Manage reviews submitted by customers.</p>
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
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{review.name}</p>
                  <p className="text-xs text-slate-500">{review.rating} star · {review.source}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{review.message}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={loadingId === review.id}
                    onClick={() => {
                      setEditingReview({ id: review.id, name: review.name, rating: review.rating, message: review.message });
                    }}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={loadingId === review.id}
                    onClick={() => {
                      void deleteReview(review.id, review.name);
                    }}
                    className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editingReview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Edit Review</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="mb-1 block text-sm font-medium text-slate-700">
                  Customer Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={editingReview.name}
                  onChange={(e) => setEditingReview({ ...editingReview, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-black placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="edit-rating" className="mb-1 block text-sm font-medium text-slate-700">
                  Rating
                </label>
                <select
                  id="edit-rating"
                  value={editingReview.rating}
                  onChange={(e) => setEditingReview({ ...editingReview, rating: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-black outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} star{value > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="edit-message" className="mb-1 block text-sm font-medium text-slate-700">
                  Review Message
                </label>
                <textarea
                  id="edit-message"
                  rows={4}
                  value={editingReview.message}
                  onChange={(e) => setEditingReview({ ...editingReview, message: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-black placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loadingId === editingReview.id}
                onClick={() => void updateReview()}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
              >
                {loadingId === editingReview.id ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
