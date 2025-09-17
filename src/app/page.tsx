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
      <div className="gradient-bg">
        <div
          className="group/design-root relative flex flex-col text-[#111618]"
          style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
        >
          <div className="layout-container flex flex-col">
            <Header />
            <main>
              <Hero />
              <AnimatedInView direction="up" type="spring" stiffness={80} damping={20}>
                <HowItWorks />
              </AnimatedInView>
              <AnimatedInView direction="scale" type="spring" stiffness={100} damping={15}>
                <Services />
              </AnimatedInView>
              <AnimatedInView direction="fade" type="tween" duration={1}>
                <Testimonials />
              </AnimatedInView>
              <AnimatedInView direction="left" type="spring" stiffness={120} damping={18}>
                <WhyChooseUs />
              </AnimatedInView>
            </main>
            <Footer />
          </div>
        </div>
      </div>
    </>
  );
}
