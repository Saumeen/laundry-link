"use client";

import { motion } from "framer-motion";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah A.",
      role: "Working Professional",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAlGiSkZMTII6wK8S-DDU6Z4mkN-JYGEpaDOQllMDodQ7GYkNzIecVIxip0ZZ4bi39-iMyUySleGLjop6Nf1gspy_a0xnmF1pjvamdEUUpZOBKJIsjfi5hbBKwbQWfVz-DSnmNh0sScEGpx6GA5TNgQytwzDByS0bwJJVFbcmf9GHR1TjF6Dlak83Honxc8_BNELP4H3KQT0NHc83rDifpsdoelob47ZO4jyq1cnUqDMRq1Rwr3FbZ-dDGS_s0TpNqFRU1DxuPKffU",
      quote:
        "Laundry Link is an absolute game-changer. The convenience and quality are top-notch. My clothes have never looked better!",
    },
    {
      name: "Fatima H.",
      role: "Fashion Enthusiast",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAlGiSkZMTII6wK8S-DDU6Z4mkN-JYGEpaDOQllMDodQ7GYkNzIecVIxip0ZZ4bi39-iMyUySleGLjop6Nf1gspy_a0xnmF1pjvamdEUUpZOBKJIsjfi5hbBKwbQWfVz-DSnmNh0sScEGpx6GA5TNgQytwzDByS0bwJJVFbcmf9GHR1TjF6Dlak83Honxc8_BNELP4H3KQT0NHc83rDifpsdoelob47ZO4jyq1cnUqDMRq1Rwr3FbZ-dDGS_s0TpNqFRU1DxuPKffU",
      quote:
        "I trust Laundry Link with my most delicate garments. Their dry cleaning service is exceptional. Highly, highly recommend!",
    },
    {
      name: "Ahmed M.",
      role: "Parent of Two",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAlGiSkZMTII6wK8S-DDU6Z4mkN-JYGEpaDOQllMDodQ7GYkNzIecVIxip0ZZ4bi39-iMyUySleGLjop6Nf1gspy_a0xnmF1pjvamdEUUpZOBKJIsjfi5hbBKwbQWfVz-DSnmNh0sScEGpx6GA5TNgQytwzDByS0bwJJVFbcmf9GHR1TjF6Dlak83Honxc8_BNELP4H3KQT0NHc83rDifpsdoelob47ZO4jyq1cnUqDMRq1Rwr3FbZ-dDGS_s0TpNqFRU1DxuPKffU",
      quote:
        "This service has given me back my weekends! The app is super easy to use, and their team is always punctual and professional.",
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
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <section className="bg-white/60 px-3 py-12 backdrop-blur-md sm:px-4 sm:py-16 md:px-6 md:py-20 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl text-center">
        <h2 className="mb-3 text-3xl font-bold tracking-tighter text-[var(--dark-blue)] sm:mb-4 sm:text-4xl lg:text-5xl">
          What Our Customers Say
        </h2>
        <p className="mx-auto mb-8 max-w-3xl text-base text-[var(--medium-blue)] sm:mb-12 sm:text-lg lg:text-xl">
          We&apos;re proud to be trusted by our community. Here's what they
          think about Laundry Link.
        </p>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex flex-col items-start gap-4 sm:gap-6 rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 lg:p-8 text-left shadow-lg sm:shadow-xl shadow-blue-200/50 transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-300/50"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <img
                  className="h-12 w-12 rounded-full object-cover sm:h-14 sm:w-14 lg:h-16 lg:w-16"
                  src={testimonial.avatarUrl}
                  alt={`Avatar of ${testimonial.name}`}
                />
                <div>
                  <p className="text-base font-bold text-gray-800 sm:text-lg lg:text-xl">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-gray-500 sm:text-sm lg:text-base">
                    {testimonial.role}
                  </p>
                </div>
              </div>
              <p className="text-sm italic text-gray-700 sm:text-base lg:text-lg">
                &quot;{testimonial.quote}&quot;
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
