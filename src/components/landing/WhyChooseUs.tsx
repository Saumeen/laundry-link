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
    <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-8 rounded-3xl bg-white p-8 shadow-2xl shadow-blue-200/50 sm:p-12 md:grid-cols-5">
          <AnimatedInView direction="right" amount={50}>
            <div className="text-center md:col-span-3 md:text-left">
              <h2 className="text-4xl font-bold tracking-tighter text-[var(--dark-blue)] sm:text-5xl">
                Why Choose Us?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-lg text-[var(--medium-blue)] sm:text-xl md:mx-0">
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
            className="grid grid-cols-1 gap-8 md:col-span-2"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex items-center gap-4 sm:gap-5"
              >
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--secondary-color)] text-[var(--primary-color)] sm:h-16 sm:w-16">
                  <span className="material-symbols-outlined text-3xl sm:text-4xl">
                    {feature.icon}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 sm:text-xl">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 sm:text-base">
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
