"use client";

import { motion } from "framer-motion";
import { AnimatedInView } from "@/components/shared/AnimatedInView";
import ScreenReaderOnly from '@/components/accessibility/ScreenReaderOnly';

interface WhyChooseUsContent {
  title: string;
  reasons: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
  }>;
}

interface WhyChooseUsProps {
  content: WhyChooseUsContent;
}

const WhyChooseUs = ({ content }: WhyChooseUsProps) => {

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <section 
      className="px-3 py-12 sm:px-4 sm:py-16 md:px-6 md:py-20 lg:px-10 lg:py-24"
      aria-labelledby="why-choose-us-heading"
    >
      <ScreenReaderOnly>
        Why choose Laundry Link for your laundry and dry cleaning needs in Bahrain
      </ScreenReaderOnly>
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-6 sm:gap-8 rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-8 lg:p-12 shadow-xl sm:shadow-2xl shadow-blue-200/50 md:grid-cols-5">
          <AnimatedInView direction="right" amount={50}>
            <header className="text-center md:col-span-3 md:text-left">
              <h2 id="why-choose-us-heading" className="text-3xl font-bold tracking-tighter text-[var(--dark-blue)] sm:text-4xl lg:text-5xl">
                {content.title || "Why Choose Laundry Link for Your Laundry Needs?"}
              </h2>
              <p className="mx-auto mt-3 sm:mt-4 max-w-lg text-base text-[var(--medium-blue)] sm:text-lg lg:text-xl md:mx-0">
                We&apos;re not just a laundry service; we&apos;re a lifestyle upgrade for busy professionals in Bahrain. Here&apos;s why we stand out from other laundry services.
              </p>
            </header>
          </AnimatedInView>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 md:col-span-2"
            role="list"
            aria-label="Reasons to choose Laundry Link"
          >
            {(content.reasons && content.reasons.length > 0 ? content.reasons : [
              { id: "1", title: "Free Collection & Delivery", description: "No hidden fees, no hassle. We come to you.", icon: "truck" },
              { id: "2", title: "Dedicated Support", description: "Our customer service team is always here to help.", icon: "phone" },
              { id: "3", title: "Live Order Tracking", description: "Stay updated every step of the way with real-time tracking.", icon: "check-circle" }
            ]).map((feature, index) => (
              <motion.article
                key={index}
                variants={itemVariants}
                className="flex items-center gap-3 sm:gap-4 lg:gap-5"
                role="listitem"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-[var(--secondary-color)] text-[var(--primary-color)] sm:h-14 sm:w-14 lg:h-16 lg:w-16" aria-hidden="true">
                  {feature.icon ? (
                    <span className="material-symbols-outlined text-2xl sm:text-3xl lg:text-4xl">
                      {feature.icon}
                    </span>
                  ) : (
                    <span className="text-2xl sm:text-3xl lg:text-4xl">⭐</span>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800 sm:text-lg lg:text-xl">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-600 sm:text-sm lg:text-base">
                    {feature.description}
                  </p>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
