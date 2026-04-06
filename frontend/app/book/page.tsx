import { BookingForm } from "@/components/BookingForm";
import { Navbar } from "@/components/Navbar";

export default function BookPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-xl space-y-6">
          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Book a Visit
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Schedule your physiotherapy home visit
            </h1>
            <p className="text-base leading-7 text-slate-600 sm:text-lg">
              Choose your preferred date and time, then share a few details so we can prepare for your session.
            </p>
          </div>

          <BookingForm />
        </div>
      </main>
    </>
  );
}
