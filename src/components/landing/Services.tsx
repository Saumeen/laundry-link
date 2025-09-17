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
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
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
        'https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
      icon: '⚡',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      title: 'Bedding & Linens',
      description: 'Fresh, clean and hygienic bedding.',
      price: 'From BD 3.000',
      imageUrl:
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2058&auto=format&fit=crop&ixlib=rb-4.0.3',
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
    <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-200/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-cyan-200/20 rounded-full blur-xl animate-pulse delay-500"></div>
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
          <h2 className="mb-4 text-4xl font-bold tracking-tighter text-[var(--dark-blue)] sm:mb-6 sm:text-5xl">
            Our Services
          </h2>
          <motion.div
            className="mx-auto mb-12 max-w-3xl text-lg text-[var(--medium-blue)] sm:mb-16 sm:text-xl"
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
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              onHoverStart={() => setHoveredCard(index)}
              onHoverEnd={() => setHoveredCard(null)}
              className="group relative flex flex-col gap-5 rounded-3xl bg-white p-6 shadow-xl shadow-blue-200/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-300/30 cursor-pointer"
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
                className="absolute -top-3 -right-3 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-2xl"
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

              <div className="relative h-56 w-full overflow-hidden rounded-2xl sm:h-64">
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
                  className="text-xl font-bold text-gray-800 sm:text-2xl"
                  whileHover={{ color: "var(--primary-color)" }}
                  transition={{ duration: 0.2 }}
                >
                  {service.title}
                </motion.h3>
                <motion.p 
                  className="mt-2 text-base text-gray-600 sm:text-lg"
                  initial={{ opacity: 0.8 }}
                  whileHover={{ opacity: 1 }}
                >
                  {service.description}
                </motion.p>
                <motion.div
                  className="mt-4"
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
                    className="text-lg font-bold text-[var(--primary-color)] sm:text-xl inline-block"
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
