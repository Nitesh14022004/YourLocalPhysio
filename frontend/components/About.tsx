export function About() {
  return (
    <section className="home-section home-about bg-gradient-to-b from-white to-sky-50/50 py-16 md:py-24">
      <div className="home-section-inner mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="home-about-grid grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <div
              className="flex aspect-[4/3] w-full items-center justify-center rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-blue-100 p-6 shadow-sm"
              aria-label="Doctor image placeholder"
              role="img"
            >
              <div className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
                  <svg
                    className="h-10 w-10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"
                    />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-medium text-slate-500">
                  Doctor image placeholder
                </p>
              </div>
            </div>
          </div>

          <div className="order-1 space-y-6 lg:order-2">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">
                About
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Dr. Bikesh Kumar B S
              </h2>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                With over 2 years of experience in physiotherapy, Dr. Bikesh Kumar B S
                focuses on pain relief, rehabilitation, and personalized recovery plans
                designed to help patients move better and feel better at home.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-sky-100 bg-white px-4 py-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">2+ Years Experience</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Practical, patient-focused physiotherapy care.
                </p>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-white px-4 py-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Home Visit Focus</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Comfortable care delivered where you need it most.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                Why patients choose us
              </h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <span>Certified physiotherapy care with a professional approach.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <span>Personalized treatment plans tailored to each patient.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <span>Home comfort for a calmer, more convenient recovery experience.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
