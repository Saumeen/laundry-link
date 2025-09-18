"use client";

import { motion } from "framer-motion";
import { AnimatedInView } from "@/components/shared/AnimatedInView";

const WhyChooseUs = () => {
  const features = [
    {
      icon: "inventory_2",
      title: "Free Collection & Delivery",
      description: "No hidden fees, no hassle.",
    },
    {
      icon: "headset_mic",
      title: "Dedicated Support",
      description: "Our team is always here to help.",
    },
    {
      icon: "notifications_active",
      title: "Live Order Tracking",
      description: "Stay updated every step of the way.",
    },
  ];

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
    <section className="px-3 py-12 sm:px-4 sm:py-16 md:px-6 md:py-20 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-6 sm:gap-8 rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-8 lg:p-12 shadow-xl sm:shadow-2xl shadow-blue-200/50 md:grid-cols-5">
          <AnimatedInView direction="right" amount={50}>
            <div className="text-center md:col-span-3 md:text-left">
              <h2 className="text-3xl font-bold tracking-tighter text-[var(--dark-blue)] sm:text-4xl lg:text-5xl">
                Why Choose Us?
              </h2>
              <p className="mx-auto mt-3 sm:mt-4 max-w-lg text-base text-[var(--medium-blue)] sm:text-lg lg:text-xl md:mx-0">
                We&apos;re not just a laundry service; we&apos;re a lifestyle
                upgrade. Here&apos;s why we stand out.
              </p>
            </div>
          </AnimatedInView>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 md:col-span-2"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex items-center gap-3 sm:gap-4 lg:gap-5"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-[var(--secondary-color)] text-[var(--primary-color)] sm:h-14 sm:w-14 lg:h-16 lg:w-16">
                  <span className="material-symbols-outlined text-2xl sm:text-3xl lg:text-4xl">
                    {feature.icon}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800 sm:text-lg lg:text-xl">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-600 sm:text-sm lg:text-base">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
