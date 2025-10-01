"use client";

import { motion } from "framer-motion";
import ScreenReaderOnly from '@/components/accessibility/ScreenReaderOnly';

interface TrustProps {
  content?: {
    title: string;
    subtitle: string;
    stats: Array<{
      id: string;
      icon: string;
      number: string;
      label: string;
    }>;
    indicators: Array<{
      id: string;
      icon: string;
      label: string;
      color: string;
    }>;
  };
}

const Trust: React.FC<TrustProps> = ({ content }) => {
  const stats = content?.stats || [
    {
      id: "1",
      icon: "groups",
      number: "5,000+",
      label: "Trusted Customers"
    },
    {
      id: "2",
      icon: "local_shipping", 
      number: "30,000+",
      label: "Pickups Completed"
    },
    {
      id: "3",
      icon: "verified",
      number: "Efada",
      label: "Certified Partner"
    }
  ];

  const indicators = content?.indicators || [
    { id: "1", icon: "security", label: "Secure & Reliable", color: "green-600" },
    { id: "2", icon: "schedule", label: "24/7 Service", color: "blue-600" },
    { id: "3", icon: "eco", label: "Eco-Friendly", color: "purple-600" }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    },
  };

  return (
    <section 
      className="relative overflow-hidden bg-gradient-to-br from-blue-50/80 via-cyan-50/60 to-indigo-50/80 px-3 py-12 sm:px-4 sm:py-16 md:px-6 md:py-20 lg:px-10 lg:py-24"
      aria-labelledby="trust-heading"
    >
      <ScreenReaderOnly>
        Trust indicators and statistics for Laundry Link laundry service in Bahrain
      </ScreenReaderOnly>
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-30" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/10 via-transparent to-cyan-100/10"></div>
      </div>
      
      <div className="relative mx-auto max-w-7xl">
        <motion.header
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-16 lg:mb-20"
        >
          <h2 id="trust-heading" className="mb-4 text-3xl font-bold tracking-tighter text-[var(--dark-blue)] sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl">
            {content?.title || "Trusted by Our Community in Bahrain"}
          </h2>
          <p className="mx-auto max-w-3xl text-base text-[var(--medium-blue)] sm:text-lg md:text-xl lg:text-2xl">
            {content?.subtitle || "See what our customers say and the trust we've built as the leading laundry service in Bahrain"}
          </p>
        </motion.header>

        {/* Horizontal Stats Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative mx-auto max-w-6xl rounded-2xl sm:rounded-3xl border border-white/20 bg-white/20 p-1 backdrop-blur-xl"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col gap-4 sm:gap-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-white/30 via-white/20 to-white/30 p-4 sm:p-6 lg:p-8 backdrop-blur-lg lg:flex-row lg:items-center lg:justify-between lg:gap-12"
            role="list"
            aria-label="Trust indicators and statistics"
          >
            {stats.map((stat) => (
              <motion.article
                key={stat.id}
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.05, 
                  y: -10,
                  transition: { type: "spring" as const, stiffness: 300, damping: 20 }
                }}
                className="group relative flex flex-1 flex-col items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl bg-white/40 p-4 sm:p-5 lg:p-6 shadow-lg sm:shadow-xl shadow-blue-200/30 backdrop-blur-md transition-all duration-300 hover:bg-white/60 hover:shadow-2xl hover:shadow-blue-300/40 lg:flex-row lg:gap-6"
                role="listitem"
                aria-label={`${stat.label}: ${stat.number}`}
              >
                {/* Animated Background Glow */}
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-400/20 via-cyan-400/10 to-indigo-400/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true"></div>
                
                {/* Icon Container */}
                <div className="relative flex h-16 w-16 sm:h-18 sm:w-18 lg:h-16 lg:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[var(--primary-color)] to-blue-600 text-white shadow-lg shadow-blue-500/30 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/50 group-hover:from-orange-500 group-hover:to-red-500" aria-hidden="true">
                  <span className="material-symbols-outlined text-2xl sm:text-3xl lg:text-2xl transition-colors duration-300 group-hover:text-white">
                    {stat.icon}
                  </span>
                  {/* Icon glow effect */}
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-400/50 to-red-500/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                </div>
                
                {/* Content */}
                <div className="relative text-center lg:text-left">
                  <p className="text-2xl font-black text-[var(--dark-blue)] transition-all duration-300 group-hover:text-[var(--primary-color)] sm:text-3xl lg:text-3xl xl:text-4xl">
                    {stat.number}
                  </p>
                  <p className="text-sm font-semibold text-[var(--medium-blue)] transition-all duration-300 group-hover:text-gray-700 sm:text-base lg:text-base xl:text-lg">
                    {stat.label}
                  </p>
                </div>

                {/* Decorative elements */}
                <div className="absolute -right-1 -top-1 h-4 w-4 sm:h-6 sm:w-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 opacity-0 transition-all duration-300 group-hover:opacity-100 lg:-right-1 lg:-top-1 lg:h-4 lg:w-4" aria-hidden="true"></div>
              </motion.article>
            ))}
          </motion.div>
        </motion.div>

        {/* Additional Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-6 sm:mt-8 flex justify-center items-center overflow-x-auto"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            {indicators.map((indicator) => {
              // Check if color is a hex code or Tailwind class
              const isHexColor = indicator.color.startsWith('#');
              const colorClass = isHexColor ? '' : `text-${indicator.color}`;
              const colorStyle = isHexColor ? { color: indicator.color } : {};
              
              return (
                <div key={indicator.id} className="flex items-center gap-1.5 rounded-full bg-white/30 px-3 py-1.5 backdrop-blur-md whitespace-nowrap">
                  <span 
                    className={`material-symbols-outlined ${colorClass} text-base`}
                    style={colorStyle}
                  >
                    {indicator.icon}
                  </span>
                  <span className="text-xs font-medium text-[var(--dark-blue)]">
                    {indicator.label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
    
  );
};

export default Trust;
