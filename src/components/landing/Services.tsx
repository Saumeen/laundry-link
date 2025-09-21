"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";

const Services = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const services = [
    {
      title: 'Wash & Iron',
      description: 'Crisp and clean everyday wear.',
      price: 'From BD 0.600',
      imageUrl:
        'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2074&auto=format&fit=crop&ixlib=rb-4.0.3',
      icon: '🧺',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Dry Cleaning',
      description: 'Gentle care for your finest garments.',
      price: 'From BD 2.500',
      imageUrl:
        'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2074&auto=format&fit=crop&ixlib=rb-4.0.3',
      icon: '👔',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      title: 'Express Service',
      description: "Laundry in a hurry? We've got you.",
      price: '+50% surcharge',
      imageUrl:
        'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2074&auto=format&fit=crop&ixlib=rb-4.0.3',
      icon: '⚡',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      title: 'Bedding & Linens',
      description: 'Fresh, clean and hygienic bedding.',
      price: 'From BD 3.000',
      imageUrl:
        'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2074&auto=format&fit=crop&ixlib=rb-4.0.3',
      icon: '🛏️',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -30, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
    },
  };


  return (
    <section className="px-3 py-12 sm:px-4 sm:py-16 md:px-6 md:py-20 lg:px-10 lg:py-24 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-4 sm:left-10 w-24 h-24 sm:w-32 sm:h-32 bg-blue-200/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-4 sm:right-10 w-32 h-32 sm:w-40 sm:h-40 bg-purple-200/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/6 sm:left-1/4 w-20 h-20 sm:w-24 sm:h-24 bg-cyan-200/20 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>

      <div className="mx-auto max-w-7xl text-center">
        <motion.div
          variants={titleVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 12,
          }}
        >
          <h2 className="mb-3 text-3xl font-bold tracking-tighter text-[var(--dark-blue)] sm:mb-4 sm:text-4xl lg:text-5xl">
            Our Services
          </h2>
          <motion.div
            className="mx-auto mb-8 max-w-3xl text-base text-[var(--medium-blue)] sm:mb-12 sm:text-lg lg:text-xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            From everyday laundry to special care items, we offer a range of
            services to meet all your needs.
          </motion.div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          transition={{
            staggerChildren: 0.15,
            delayChildren: 0.3,
          }}
          className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              onHoverStart={() => setHoveredCard(index)}
              onHoverEnd={() => setHoveredCard(null)}
              className="group relative flex flex-col gap-3 sm:gap-4 lg:gap-5 rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 lg:p-6 shadow-lg sm:shadow-xl shadow-blue-200/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-300/30 cursor-pointer"
              whileHover={{
                y: -2,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  mass: 0.8
                }
              }}
              whileTap={{
                scale: 0.98,
                transition: {
                  type: "spring",
                  stiffness: 600,
                  damping: 25
                }
              }}
            >
              {/* Gradient overlay on hover */}
              <div
                className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
              />

              {/* Icon badge */}
              <motion.div
                className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-lg sm:text-2xl"
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 + 0.5, type: "spring", stiffness: 200 }}
                whileHover={{
                  scale: 1.1,
                  rotate: 5,
                  transition: {
                    type: "spring",
                    stiffness: 400,
                    damping: 25
                  }
                }}
              >
                {service.icon}
              </motion.div>

              <div className="relative h-48 w-full overflow-hidden rounded-xl sm:h-56 sm:rounded-2xl lg:h-64">
                <Image
                  src={service.imageUrl}
                  alt={service.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-all duration-500 group-hover:scale-102 group-hover:brightness-105"
                  priority={index < 2}
                />
                {/* Image overlay gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${service.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                />
              </div>

              <div className="text-left relative z-10">
                <motion.h3 
                  className="text-lg font-bold text-gray-800 sm:text-xl lg:text-2xl"
                  whileHover={{ color: "var(--primary-color)" }}
                  transition={{ duration: 0.2 }}
                >
                  {service.title}
                </motion.h3>
                <motion.p 
                  className="mt-1 sm:mt-2 text-sm text-gray-600 sm:text-base lg:text-lg"
                  initial={{ opacity: 0.8 }}
                  whileHover={{ opacity: 1 }}
                >
                  {service.description}
                </motion.p>
                <motion.div
                  className="mt-3 sm:mt-4"
                  whileHover={{
                    scale: 1.02,
                    transition: {
                      type: "spring",
                      stiffness: 400,
                      damping: 25
                    }
                  }}
                >
                  <motion.p 
                    className="text-base font-bold text-[var(--primary-color)] sm:text-lg lg:text-xl inline-block"
                    animate={{
                      backgroundPosition: hoveredCard === index ? "200% center" : "0% center"
                    }}
                    transition={{ duration: 0.5 }}
                    style={{
                      background: "linear-gradient(90deg, var(--primary-color) 0%, #ff6b6b 50%, var(--primary-color) 100%)",
                      backgroundSize: "200% auto",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text"
                    }}
                  >
                    {service.price}
                  </motion.p>
                </motion.div>
              </div>

            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Services;
