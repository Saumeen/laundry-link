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
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50/80 via-cyan-50/60 to-indigo-50/80 px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/10 via-transparent to-cyan-100/10"></div>
      </div>
      
      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 sm:mb-20"
        >
          <h2 className="mb-6 text-4xl font-bold tracking-tighter text-[var(--dark-blue)] sm:mb-8 sm:text-5xl lg:text-6xl">
            Trusted by Our Community
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-[var(--medium-blue)] sm:text-xl lg:text-2xl">
            See what our customers say and the trust we've built in Bahrain
          </p>
        </motion.div>

        {/* Horizontal Stats Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative mx-auto max-w-6xl rounded-3xl border border-white/20 bg-white/20 p-1 backdrop-blur-xl"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col gap-6 rounded-2xl bg-gradient-to-r from-white/30 via-white/20 to-white/30 p-8 backdrop-blur-lg lg:flex-row lg:items-center lg:justify-between lg:gap-12"
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
                className="group relative flex flex-1 flex-col items-center gap-4 rounded-2xl bg-white/40 p-6 shadow-xl shadow-blue-200/30 backdrop-blur-md transition-all duration-300 hover:bg-white/60 hover:shadow-2xl hover:shadow-blue-300/40 lg:flex-row lg:gap-6"
              >
                {/* Animated Background Glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/20 via-cyan-400/10 to-indigo-400/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                
                {/* Icon Container */}
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary-color)] to-blue-600 text-white shadow-lg shadow-blue-500/30 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/50 lg:h-16 lg:w-16">
                  <span className="material-symbols-outlined text-3xl lg:text-2xl">
                    {stat.icon}
                  </span>
                  {/* Icon glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--primary-color)]/50 to-blue-600/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                </div>
                
                {/* Content */}
                <div className="relative text-center lg:text-left">
                  <p className="text-3xl font-black text-[var(--dark-blue)] transition-all duration-300 group-hover:text-[var(--primary-color)] sm:text-4xl lg:text-3xl xl:text-4xl">
                    {stat.number}
                  </p>
                  <p className="text-lg font-semibold text-[var(--medium-blue)] transition-all duration-300 group-hover:text-gray-700 lg:text-base xl:text-lg">
                    {stat.label}
                  </p>
                </div>

                {/* Decorative elements */}
                <div className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 opacity-0 transition-all duration-300 group-hover:opacity-100 lg:-right-1 lg:-top-1 lg:h-4 lg:w-4"></div>
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
          className="mt-12 flex flex-wrap justify-center gap-6 sm:mt-16"
        >
          <div className="flex items-center gap-3 rounded-full bg-white/30 px-6 py-3 backdrop-blur-md">
            <span className="material-symbols-outlined text-green-600">
              security
            </span>
            <span className="text-sm font-medium text-[var(--dark-blue)]">
              Secure & Reliable
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-full bg-white/30 px-6 py-3 backdrop-blur-md">
            <span className="material-symbols-outlined text-blue-600">
              schedule
            </span>
            <span className="text-sm font-medium text-[var(--dark-blue)]">
              24/7 Service
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-full bg-white/30 px-6 py-3 backdrop-blur-md">
            <span className="material-symbols-outlined text-purple-600">
              eco
            </span>
            <span className="text-sm font-medium text-[var(--dark-blue)]">
              Eco-Friendly
            </span>
          </div>
        </motion.div>
      </div>
    </section>
    
  );
};

export default Trust;
