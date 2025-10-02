"use client";

import { motion } from "framer-motion";
import ScreenReaderOnly from '@/components/accessibility/ScreenReaderOnly';

interface Testimonial {
  id: number;
  rating: number;
  title: string | null;
  comment: string;
  imageUrl: string | null;
  isVerified: boolean;
  createdAt: string;
  customer: {
    name: string;
  };
}

interface TestimonialsContent {
  title: string;
  displayMode: "auto" | "manual";
  selectedReviewIds: number[];
}

interface TestimonialsProps {
  content: TestimonialsContent;
  testimonials: Testimonial[];
  isLoading?: boolean;
  error?: string;
}

const Testimonials = ({ content, testimonials, isLoading = false, error }: TestimonialsProps) => {

  // Fallback testimonials in case API fails or no reviews exist
  const fallbackTestimonials = [
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
    {
      name: "Maria L.",
      role: "Business Owner",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAlGiSkZMTII6wK8S-DDU6Z4mkN-JYGEpaDOQllMDodQ7GYkNzIecVIxip0ZZ4bi39-iMyUySleGLjop6Nf1gspy_a0xnmF1pjvamdEUUpZOBKJIsjfi5hbBKwbQWfVz-DSnmNh0sScEGpx6GA5TNgQytwzDByS0bwJJVFbcmf9GHR1TjF6Dlak83Honxc8_BNELP4H3KQT0NHc83rDifpsdoelob47ZO4jyq1cnUqDMRq1Rwr3FbZ-dDGS_s0TpNqFRU1DxuPKffU",
      quote:
        "As a busy entrepreneur, Laundry Link saves me hours every week. The quality is consistent and the pickup/delivery is always on time.",
    },
    {
      name: "David K.",
      role: "Student",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAlGiSkZMTII6wK8S-DDU6Z4mkN-JYGEpaDOQllMDodQ7GYkNzIecVIxip0ZZ4bi39-iMyUySleGLjop6Nf1gspy_a0xnmF1pjvamdEUUpZOBKJIsjfi5hbBKwbQWfVz-DSnmNh0sScEGpx6GA5TNgQytwzDByS0bwJJVFbcmf9GHR1TjF6Dlak83Honxc8_BNELP4H3KQT0NHc83rDifpsdoelob47ZO4jyq1cnUqDMRq1Rwr3FbZ-dDGS_s0TpNqFRU1DxuPKffU",
      quote:
        "Perfect for college life! Affordable prices and they handle everything. I can focus on my studies while they take care of my laundry.",
    },
    {
      name: "Jennifer R.",
      role: "Healthcare Worker",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAlGiSkZMTII6wK8S-DDU6Z4mkN-JYGEpaDOQllMDodQ7GYkNzIecVIxip0ZZ4bi39-iMyUySleGLjop6Nf1gspy_a0xnmF1pjvamdEUUpZOBKJIsjfi5hbBKwbQWfVz-DSnmNh0sScEGpx6GA5TNgQytwzDByS0bwJJVFbcmf9GHR1TjF6Dlak83Honxc8_BNELP4H3KQT0NHc83rDifpsdoelob47ZO4jyq1cnUqDMRq1Rwr3FbZ-dDGS_s0TpNqFRU1DxuPKffU",
      quote:
        "Working long shifts, I need reliable service. Laundry Link never disappoints. My scrubs are always perfectly clean and ready for work.",
    },
    {
      name: "Michael T.",
      role: "Retiree",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAlGiSkZMTII6wK8S-DDU6Z4mkN-JYGEpaDOQllMDodQ7GYkNzIecVIxip0ZZ4bi39-iMyUySleGLjop6Nf1gspy_a0xnmF1pjvamdEUUpZOBKJIsjfi5hbBKwbQWfVz-DSnmNh0sScEGpx6GA5TNgQytwzDByS0bwJJVFbcmf9GHR1TjF6Dlak83Honxc8_BNELP4H3KQT0NHc83rDifpsdoelob47ZO4jyq1cnUqDMRq1Rwr3FbZ-dDGS_s0TpNqFRU1DxuPKffU",
      quote:
        "At my age, carrying heavy laundry bags is difficult. Laundry Link makes life so much easier. Courteous staff and excellent service!",
    },
    {
      name: "Lisa P.",
      role: "New Mom",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAlGiSkZMTII6wK8S-DDU6Z4mkN-JYGEpaDOQllMDodQ7GYkNzIecVIxip0ZZ4bi39-iMyUySleGLjop6Nf1gspy_a0xnmF1pjvamdEUUpZOBKJIsjfi5hbBKwbQWfVz-DSnmNh0sScEGpx6GA5TNgQytwzDByS0bwJJVFbcmf9GHR1TjF6Dlak83Honxc8_BNELP4H3KQT0NHc83rDifpsdoelob47ZO4jyq1cnUqDMRq1Rwr3FbZ-dDGS_s0TpNqFRU1DxuPKffU",
      quote:
        "With a newborn, I have no time for laundry. Laundry Link handles all our family's clothes with care. Baby clothes come back so soft!",
    },
  ];

  // Show loading state
  if (isLoading) {
    return (
      <section 
        className="bg-white/60 py-12 backdrop-blur-md sm:py-16 md:py-20 lg:py-24"
        aria-labelledby="testimonials-heading"
      >
        <div className="mx-auto max-w-7xl text-center px-3 sm:px-4 md:px-6 lg:px-10">
          <h2 id="testimonials-heading" className="mb-3 text-3xl font-bold tracking-tighter text-[var(--dark-blue)] sm:mb-4 sm:text-4xl lg:text-5xl">
            {content.title || "What Our Customers Say About Our Laundry Service"}
          </h2>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
            <span className="ml-3 text-lg text-gray-600">Loading testimonials...</span>
          </div>
        </div>
      </section>
    );
  }

  // Show error state
  if (error) {
    return (
      <section 
        className="bg-white/60 py-12 backdrop-blur-md sm:py-16 md:py-20 lg:py-24"
        aria-labelledby="testimonials-heading"
      >
        <div className="mx-auto max-w-7xl text-center px-3 sm:px-4 md:px-6 lg:px-10">
          <h2 id="testimonials-heading" className="mb-3 text-3xl font-bold tracking-tighter text-[var(--dark-blue)] sm:mb-4 sm:text-4xl lg:text-5xl">
            {content.title || "What Our Customers Say About Our Laundry Service"}
          </h2>
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-lg text-gray-600 mb-4">Unable to load testimonials</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  // Convert testimonials to display format or use fallback
  const displayTestimonials = testimonials.length > 0 
    ? testimonials.map(testimonial => ({
        name: testimonial.customer.name,
        role: testimonial.isVerified ? "Verified Customer" : "Customer",
        avatarUrl: testimonial.imageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuAlGiSkZMTII6wK8S-DDU6Z4mkN-JYGEpaDOQllMDodQ7GYkNzIecVIxip0ZZ4bi39-iMyUySleGLjop6Nf1gspy_a0xnmF1pjvamdEUUpZOBKJIsjfi5hbBKwbQWfVz-DSnmNh0sScEGpx6GA5TNgQytwzDByS0bwJJVFbcmf9GHR1TjF6Dlak83Honxc8_BNELP4H3KQT0NHc83rDifpsdoelob47ZO4jyq1cnUqDMRq1Rwr3FbZ-dDGS_s0TpNqFRU1DxuPKffU",
        quote: testimonial.comment,
        rating: testimonial.rating,
        isVerified: testimonial.isVerified,
        orderNumber: undefined,
      }))
    : fallbackTestimonials.map(testimonial => ({
        ...testimonial,
        rating: undefined,
        isVerified: false,
        orderNumber: undefined,
      }));

  // Limit testimonials for performance (max 20 for smooth animation)
  const limitedTestimonials = displayTestimonials.slice(0, 20);
  
  // Duplicate testimonials for seamless loop
  const duplicatedTestimonials = [...limitedTestimonials, ...limitedTestimonials];

  return (
    <section 
      className="bg-white/60 py-12 backdrop-blur-md sm:py-16 md:py-20 lg:py-24"
      aria-labelledby="testimonials-heading"
    >
      <ScreenReaderOnly>
        Customer testimonials and reviews for Laundry Link laundry service in Bahrain
      </ScreenReaderOnly>
      <div className="mx-auto max-w-7xl text-center px-3 sm:px-4 md:px-6 lg:px-10">
        <h2 id="testimonials-heading" className="mb-3 text-3xl font-bold tracking-tighter text-[var(--dark-blue)] sm:mb-4 sm:text-4xl lg:text-5xl">
          {content.title || "What Our Customers Say About Our Laundry Service"}
        </h2>
        <p className="mx-auto mb-8 max-w-3xl text-base text-[var(--medium-blue)] sm:mb-12 sm:text-lg lg:text-xl">
          We&apos;re proud to be trusted by our community in Bahrain. Here's what our customers think about Laundry Link's professional laundry and dry cleaning service.
        </p>
      </div>
      
      {/* Full-width sliding testimonials container */}
      <div className="relative overflow-hidden w-full py-4" aria-live="polite" aria-label="Customer testimonials carousel">
          <motion.div
            className="flex gap-4 sm:gap-6 md:gap-8"
            animate={{
              x: [0, -(displayTestimonials.length * 400 + (displayTestimonials.length - 1) * 32)], // Move by exactly half the duplicated width
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 30, // 30 seconds for full cycle
                ease: "linear",
              },
            }}
            style={{
              width: `${duplicatedTestimonials.length * 400 + (duplicatedTestimonials.length - 1) * 32}px`, // Set explicit width for smooth animation
            }}
            role="list"
            aria-label="Customer testimonials"
          >
            {duplicatedTestimonials.map((testimonial, index) => (
              <motion.article
                key={`${testimonial.name}-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="flex-shrink-0 w-80 sm:w-96 md:w-[400px]"
                role="listitem"
              >
                <blockquote className="flex flex-col items-start gap-4 sm:gap-6 rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 lg:p-8 text-left shadow-lg sm:shadow-xl shadow-blue-200/50 transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-300/50 h-full">
                    <div className="flex items-center gap-3 sm:gap-4 w-full">
                      <img
                        className="h-12 w-12 rounded-full object-cover sm:h-14 sm:w-14 lg:h-16 lg:w-16"
                        src={testimonial.avatarUrl}
                        alt={`Avatar of ${testimonial.name}, ${testimonial.role}`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <cite className="text-base font-bold text-gray-800 sm:text-lg lg:text-xl not-italic">
                            {testimonial.name}
                          </cite>
                          {testimonial.isVerified && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium" aria-label="Verified customer">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 sm:text-sm lg:text-base">
                          {testimonial.role}
                        </p>
                        {/* Star Rating */}
                        {testimonial.rating && (
                          <div className="flex items-center gap-1 mt-1" role="img" aria-label={`${testimonial.rating} out of 5 stars`}>
                            {Array.from({ length: 5 }, (_, i) => (
                              <span
                                key={i}
                                className={`text-sm ${
                                  i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                                aria-hidden="true"
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm italic text-gray-700 sm:text-base lg:text-lg">
                      &quot;{testimonial.quote}&quot;
                    </p>
                    {/* Order Number if available */}
                    {testimonial.orderNumber && (
                      <p className="text-xs text-gray-500 mt-auto">
                        Order #{testimonial.orderNumber}
                      </p>
                    )}
                  </blockquote>
              </motion.article>
            ))}
          </motion.div>
        </div>
    </section>
  );
};

export default Testimonials;
