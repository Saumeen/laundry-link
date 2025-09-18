"use client";

import { motion, useAnimation, useInView } from "framer-motion";
import { useEffect, useRef } from "react";
import { AnimatedInView } from "@/components/shared/AnimatedInView";

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      title: "Book Your Pickup",
      description: "Use our app or website to schedule a convenient pickup time.",
    },
    {
      number: 2,
      title: "We Collect & Clean",
      description: "Our team collects your laundry and treats it with expert care.",
    },
    {
      number: 3,
      title: "Swift Delivery",
      description: "We deliver your fresh, clean clothes back within 24 hours.",
    },
  ];

  return (
    <section className="bg-white/60 px-4 py-16 backdrop-blur-md sm:px-6 sm:py-20 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <AnimatedInView direction="up" amount={30}>
          <div className="mb-12 text-center sm:mb-20">
            <h2 className="mb-4 text-4xl font-bold tracking-tighter text-[var(--dark-blue)] sm:mb-6 sm:text-5xl">
              How It Works
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-[var(--medium-blue)] sm:text-xl">
              Experience seamless laundry service in three simple steps. We handle
              the rest, so you can enjoy your day.
            </p>
          </div>
        </AnimatedInView>
        
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative flex flex-col gap-8">
            {/* Connecting lines */}
            <div className="absolute left-8 top-16 h-full w-0.5 bg-gradient-to-b from-[var(--secondary-color)] via-[var(--primary-color)] to-[var(--secondary-color)] opacity-30 lg:left-8"></div>
            
            {steps.map((step, index) => (
              <StepCard key={step.number} step={step} index={index} />
            ))}
          </div>
          
          <AnimatedInView direction="left" amount={50} delay={0.6}>
            <div className="flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 1.2,
                  delay: 0.8,
                  ease: "easeOut",
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
                className="relative"
              >
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] opacity-20 blur-xl"></div>
                <img
                  alt="Laundry Link process visualization"
                  className="relative h-auto w-full max-w-sm rounded-3xl object-cover shadow-2xl"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgOE90kaFAPm69T9BvHJyq8kOF90vb_vY8GI48t7lPt6okwKyVIhXp0AQvbyY7380sRFaZK1aAff_hP5EkTfDZIvLqbITE2R2joS6m-qcR7F5UT-5WRTfvDJrxqNaU9ynmc0Ny-G_btd4nFF1PprRAEHffArbq4_Ld25xtRKznG6H3suTg9oSBJSFQK7wPIfOJeYwGFOxcmInjx40TU72A3BDyo-eDqDGibNHhNVGbsU7cFNDW7Dzd4TzsNbyaEFhsiE9drbF0rrc"
                />
              </motion.div>
            </div>
          </AnimatedInView>
        </div>
      </div>
    </section>
  );
};

interface StepCardProps {
  step: {
    number: number;
    title: string;
    description: string;
  };
  index: number;
}

const StepCard: React.FC<StepCardProps> = ({ step, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      x: -100,
      scale: 0.8,
      rotateY: -15
    },
    visible: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      rotateY: 0
    }
  };

  const numberVariants = {
    hidden: { 
      scale: 0,
      rotate: -180,
      opacity: 0
    },
    visible: { 
      scale: 1,
      rotate: 0,
      opacity: 1
    }
  };

  const contentVariants = {
    hidden: { 
      opacity: 0,
      y: 20
    },
    visible: { 
      opacity: 1,
      y: 0
    }
  };

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={controls}
      transition={{
        duration: 0.8,
        delay: index * 0.2,
        ease: "easeOut"
      }}
      className="group flex cursor-pointer items-start gap-6 rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-[var(--primary-color)]"
      whileHover={{
        y: -2,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 25,
          mass: 0.8
        }
      }}
    >
      {/* Glow effect on hover */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] opacity-0 blur transition-opacity duration-500 group-hover:opacity-20"></div>
      
      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[var(--secondary-color)] text-4xl font-bold text-[var(--primary-color)] transition-colors duration-300 group-hover:bg-white">
        {step.number}
      </div>
      
      <motion.div 
        variants={contentVariants}
        transition={{
          duration: 0.6,
          delay: index * 0.2 + 0.5,
          ease: "easeOut"
        }}
        className="relative z-10"
      >
        <h3 className="text-2xl font-bold text-gray-800 transition-colors duration-500 group-hover:text-white">
          {step.title}
        </h3>
        <p className="mt-2 text-lg text-gray-600 transition-colors duration-500 group-hover:text-blue-100">
          {step.description}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default HowItWorks;
