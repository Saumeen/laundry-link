"use client";

import { motion, useAnimation, useInView } from "framer-motion";
import { useEffect, useRef } from "react";
import { AnimatedInView } from "@/components/shared/AnimatedInView";
import Image from "next/image";
import ScreenReaderOnly from '@/components/accessibility/ScreenReaderOnly';
import { IconRenderer } from '@/components/ui/IconRenderer';

interface HowItWorksContent {
  title: string;
  image: string;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
  }>;
}

interface HowItWorksProps {
  content: HowItWorksContent;
}

const HowItWorks = ({ content }: HowItWorksProps) => {

  return (
    <section 
      className="bg-white/60 px-3 py-12 backdrop-blur-md sm:px-4 sm:py-16 md:px-6 md:py-20 lg:px-10 lg:py-24"
      aria-labelledby="how-it-works-heading"
    >
      <ScreenReaderOnly>
        How Laundry Link's professional laundry service works in three simple steps
      </ScreenReaderOnly>
      <div className="mx-auto max-w-7xl">
        <AnimatedInView direction="up" amount={30}>
          <header className="mb-8 text-center sm:mb-12 lg:mb-20">
            <h2 id="how-it-works-heading" className="mb-3 text-3xl font-bold tracking-tighter text-[var(--dark-blue)] sm:mb-4 sm:text-4xl lg:text-5xl">
              {content.title || "How Our Laundry Service Works"}
            </h2>
            <p className="mx-auto max-w-3xl text-base text-[var(--medium-blue)] sm:text-lg lg:text-xl">
              Experience seamless laundry service in three simple steps. We handle the rest, so you can enjoy your day while we take care of your laundry needs in Bahrain.
            </p>
          </header>
        </AnimatedInView>
        
        <div className="grid grid-cols-1 items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative flex flex-col gap-6 sm:gap-8" role="list" aria-label="How our laundry service works">
            {/* Connecting lines */}
            <div className="absolute left-6 top-12 h-full w-0.5 bg-gradient-to-b from-[var(--secondary-color)] via-[var(--primary-color)] to-[var(--secondary-color)] opacity-30 sm:left-8 sm:top-16" aria-hidden="true"></div>
            
            {(content.steps && content.steps.length > 0 ? content.steps : [
              { id: "1", title: "Book Your Pickup", description: "Use our app or website to schedule a convenient pickup time that works for you.", icon: "calendar" },
              { id: "2", title: "We Collect & Clean", description: "Our professional team collects your laundry and treats it with expert care using eco-friendly methods.", icon: "truck" },
              { id: "3", title: "Swift Delivery", description: "We deliver your fresh, clean clothes back within 24 hours, right to your doorstep.", icon: "home" }
            ]).map((step, index) => (
              <StepCard key={step.id} step={step} index={index} />
            ))}
          </div>
          
          <AnimatedInView direction="left" amount={50} delay={0.6}>
            <div className="flex items-center justify-center mt-6 lg:mt-0">
              <motion.figure
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
                <div className="absolute -inset-3 sm:-inset-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] opacity-20 blur-xl" aria-hidden="true"></div>
                <Image
                  alt="Laundry Link process visualization showing the three-step laundry service workflow"
                  className="relative h-auto w-full max-w-xs sm:max-w-sm rounded-2xl sm:rounded-3xl object-cover shadow-xl sm:shadow-2xl"
                  src={content.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuDgOE90kaFAPm69T9BvHJyq8kOF90vb_vY8GI48t7lPt6okwKyVIhXp0AQvbyY7380sRFaZK1aAff_hP5EkTfDZIvLqbITE2R2joS6m-qcR7F5UT-5WRTfvDJrxqNaU9ynmc0Ny-G_btd4nFF1PprRAEHffArbq4_Ld25xtRKznG6H3suTg9oSBJSFQK7wPIfOJeYwGFOxcmInjx40TU72A3BDyo-eDqDGibNHhNVGbsU7cFNDW7Dzd4TzsNbyaEFhsiE9drbF0rrc"}
                  width={400}
                  height={300}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <ScreenReaderOnly>
                  Visual representation of Laundry Link's three-step process: booking, collection and cleaning, and delivery
                </ScreenReaderOnly>
              </motion.figure>
            </div>
          </AnimatedInView>
        </div>
      </div>
    </section>
  );
};

interface StepCardProps {
  step: {
    id: string;
    title: string;
    description: string;
    icon: string;
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
    <motion.article
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={controls}
      transition={{
        duration: 0.8,
        delay: index * 0.2,
        ease: "easeOut"
      }}
      className="group flex cursor-pointer items-start gap-4 sm:gap-6 rounded-xl sm:rounded-2xl bg-white p-4 sm:p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-[var(--primary-color)] focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
      whileHover={{
        y: -2,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 25,
          mass: 0.8
        }
      }}
      role="listitem"
      tabIndex={0}
      aria-label={`Step ${index + 1}: ${step.title} - ${step.description}`}
    >
      {/* Glow effect on hover */}
      <div className="absolute -inset-1 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] opacity-0 blur transition-opacity duration-500 group-hover:opacity-20" aria-hidden="true"></div>
      
      <div className="flex h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center rounded-full bg-[var(--secondary-color)] text-2xl sm:text-4xl font-bold text-[var(--primary-color)] transition-colors duration-300 group-hover:bg-white" aria-hidden="true">
        {step.icon ? (
          <IconRenderer 
            iconName={step.icon} 
            className="text-2xl sm:text-3xl" 
            size={24}
          />
        ) : (
          index + 1
        )}
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
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 transition-colors duration-500 group-hover:text-white">
          {step.title}
        </h3>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg text-gray-600 transition-colors duration-500 group-hover:text-blue-100">
          {step.description}
        </p>
      </motion.div>
    </motion.article>
  );
};

export default HowItWorks;
