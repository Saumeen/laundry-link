import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Services from "@/components/landing/Services";
import Testimonials from "@/components/landing/Testimonials";
import WhyChooseUs from "@/components/landing/WhyChooseUs";
import Footer from "@/components/landing/Footer";
import { AnimatedInView } from "@/components/shared/AnimatedInView";

export const metadata: Metadata = {
  title: "Laundry Link",
};

export default function HomePage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.gstatic.com/" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?display=swap&family=Inter:wght@400;500;700;900&family=Noto+Sans:wght@400;500;700;900"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
      />
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Services />
        <Testimonials />
        <WhyChooseUs />
        <Footer />
      </main>
    </>
  );
}
