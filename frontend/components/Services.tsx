const services = [
  {
    title: "Home assessment",
    description:
      "Full evaluation in your space so we understand your mobility, goals, and daily routine.",
  },
  {
    title: "Post-injury rehab",
    description:
      "Structured programmes after sprains, strains, or surgery—without travel to a clinic.",
  },
  {
    title: "Pain & stiffness",
    description:
      "Hands-on treatment and exercise plans for back, neck, and joint discomfort at home.",
  },
  {
    title: "Mobility & balance",
    description:
      "Strength, coordination, and confidence on your feet—especially after illness or falls.",
  },
  {
    title: "Elderly & long-term support",
    description:
      "Gentle, ongoing physiotherapy to maintain independence and quality of life.",
  },
] as const;

export function Services() {
  return (
    <div className="home-section home-services animate-fade-in-section bg-white py-16 md:py-20">
      <div className="home-section-inner mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-slate-900 md:text-4xl">
          Our Services
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-500">
          Personalized physiotherapy treatments delivered at your home.
        </p>

        <ul className="home-services-grid mt-12 grid list-none gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {services.map((item) => (
            <li key={item.title} className="h-full">
              <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-sky-50/40 p-6 shadow-sm transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(0,0,0,0.08)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
