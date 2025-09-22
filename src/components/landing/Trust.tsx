"use client";

import { motion } from "framer-motion";

const Trust = () => {
  const stats = [
    {
      icon: "groups",
      number: "5,000+",
      label: "Trusted Customers"
    },
    {
      icon: "local_shipping", 
      number: "30,000+",
      label: "Pickups Completed"
    },
    {
      icon: "verified",
      number: "Efada",
      label: "Certified Partner"
    }
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
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50/80 via-cyan-50/60 to-indigo-50/80 px-3 py-12 sm:px-4 sm:py-16 md:px-6 md:py-20 lg:px-10 lg:py-24">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/10 via-transparent to-cyan-100/10"></div>
      </div>
      
      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-16 lg:mb-20"
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tighter text-[var(--dark-blue)] sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl">
            Trusted by Our Community
          </h2>
          <p className="mx-auto max-w-3xl text-base text-[var(--medium-blue)] sm:text-lg md:text-xl lg:text-2xl">
            See what our customers say and the trust we've built in Bahrain
          </p>
        </motion.div>

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
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.05, 
                  y: -10,
                  transition: { type: "spring" as const, stiffness: 300, damping: 20 }
                }}
                className="group relative flex flex-1 flex-col items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl bg-white/40 p-4 sm:p-5 lg:p-6 shadow-lg sm:shadow-xl shadow-blue-200/30 backdrop-blur-md transition-all duration-300 hover:bg-white/60 hover:shadow-2xl hover:shadow-blue-300/40 lg:flex-row lg:gap-6"
              >
                {/* Animated Background Glow */}
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-400/20 via-cyan-400/10 to-indigo-400/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                
                {/* Icon Container */}
                <div className="relative flex h-16 w-16 sm:h-18 sm:w-18 lg:h-16 lg:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[var(--primary-color)] to-blue-600 text-white shadow-lg shadow-blue-500/30 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/50 group-hover:from-orange-500 group-hover:to-red-500">
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
                <div className="absolute -right-1 -top-1 h-4 w-4 sm:h-6 sm:w-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 opacity-0 transition-all duration-300 group-hover:opacity-100 lg:-right-1 lg:-top-1 lg:h-4 lg:w-4"></div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Additional Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 sm:mt-12 lg:mt-16"
        >
          <div className="flex items-center gap-2 sm:gap-3 rounded-full bg-white/30 px-4 py-2 sm:px-6 sm:py-3 backdrop-blur-md">
            <span className="material-symbols-outlined text-green-600 text-lg sm:text-xl">
              security
            </span>
            <span className="text-xs sm:text-sm font-medium text-[var(--dark-blue)]">
              Secure & Reliable
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 rounded-full bg-white/30 px-4 py-2 sm:px-6 sm:py-3 backdrop-blur-md">
            <span className="material-symbols-outlined text-blue-600 text-lg sm:text-xl">
              schedule
            </span>
            <span className="text-xs sm:text-sm font-medium text-[var(--dark-blue)]">
              24/7 Service
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 rounded-full bg-white/30 px-4 py-2 sm:px-6 sm:py-3 backdrop-blur-md">
            <span className="material-symbols-outlined text-purple-600 text-lg sm:text-xl">
              eco
            </span>
            <span className="text-xs sm:text-sm font-medium text-[var(--dark-blue)]">
              Eco-Friendly
            </span>
          </div>
        </motion.div>
      </div>
    </section>
    
  );
};

export default Trust;
