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
    <section className="bg-white/60 px-4 py-16 backdrop-blur-md sm:px-6 sm:py-20 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl text-center">
        <h2 className="mb-4 text-4xl font-bold tracking-tighter text-[var(--dark-blue)] sm:mb-6 sm:text-5xl">
          What Our Customers Say
        </h2>
        <p className="mx-auto mb-12 max-w-3xl text-lg text-[var(--medium-blue)] sm:mb-16 sm:text-xl">
          We&apos;re proud to be trusted by our community. Here’s what they
          think about Laundry Link.
        </p>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex flex-col items-start gap-6 rounded-3xl bg-white p-6 text-left shadow-xl shadow-blue-200/50 transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-300/50 sm:p-8"
            >
              <div className="flex items-center gap-4">
                <img
                  className="h-14 w-14 rounded-full object-cover sm:h-16 sm:w-16"
                  src={testimonial.avatarUrl}
                  alt={`Avatar of ${testimonial.name}`}
                />
                <div>
                  <p className="text-lg font-bold text-gray-800 sm:text-xl">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-500 sm:text-md">
                    {testimonial.role}
                  </p>
                </div>
              </div>
              <p className="text-base italic text-gray-700 sm:text-lg">
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
