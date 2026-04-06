import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Navbar } from "@/components/Navbar";
import { Services } from "@/components/Services";
import { Testimonials } from "@/components/Testimonials";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <section id="home" className="scroll-mt-16">
          <Hero />
        </section>

        <section id="services" className="scroll-mt-16">
          <Services />
        </section>
        <section id="how-it-works" className="scroll-mt-16">
          <HowItWorks />
        </section>
        <section id="about" className="scroll-mt-16">
          <About />
        </section>
        <section id="testimonials" className="scroll-mt-16">
          <Testimonials />
        </section>
        <section id="contact" className="scroll-mt-16">
          <Contact />
        </section>
      </main>
    </>
  );
}
