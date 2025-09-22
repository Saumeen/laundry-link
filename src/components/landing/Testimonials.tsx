"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface Review {
  id: number;
  rating: number;
  title?: string;
  comment: string;
  isVerified: boolean;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
  };
  order?: {
    orderNumber: string;
  };
}

const Testimonials = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch('/api/reviews?limit=8');
        if (response.ok) {
          const data = await response.json() as { reviews: Review[] };
          setReviews(data.reviews || []);
        } else {
          console.error('Failed to fetch reviews');
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // Convert reviews to testimonials format or use fallback
  const testimonials = reviews.length > 0 
    ? reviews.map(review => ({
        name: `${review.customer.firstName} ${review.customer.lastName.charAt(0)}.`,
        role: review.isVerified ? "Verified Customer" : "Customer",
        avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAlGiSkZMTII6wK8S-DDU6Z4mkN-JYGEpaDOQllMDodQ7GYkNzIecVIxip0ZZ4bi39-iMyUySleGLjop6Nf1gspy_a0xnmF1pjvamdEUUpZOBKJIsjfi5hbBKwbQWfVz-DSnmNh0sScEGpx6GA5TNgQytwzDByS0bwJJVFbcmf9GHR1TjF6Dlak83Honxc8_BNELP4H3KQT0NHc83rDifpsdoelob47ZO4jyq1cnUqDMRq1Rwr3FbZ-dDGS_s0TpNqFRU1DxuPKffU",
        quote: review.comment,
        rating: review.rating,
        isVerified: review.isVerified,
        orderNumber: review.order?.orderNumber,
      }))
    : fallbackTestimonials.map(testimonial => ({
        ...testimonial,
        rating: undefined,
        isVerified: false,
        orderNumber: undefined,
      }));

  // Duplicate testimonials for seamless loop
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  return (
    <section className="bg-white/60 py-12 backdrop-blur-md sm:py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl text-center px-3 sm:px-4 md:px-6 lg:px-10">
        <h2 className="mb-3 text-3xl font-bold tracking-tighter text-[var(--dark-blue)] sm:mb-4 sm:text-4xl lg:text-5xl">
          What Our Customers Say
        </h2>
        <p className="mx-auto mb-8 max-w-3xl text-base text-[var(--medium-blue)] sm:mb-12 sm:text-lg lg:text-xl">
          We&apos;re proud to be trusted by our community. Here's what they
          think about Laundry Link.
        </p>
      </div>
      
      {/* Full-width sliding testimonials container */}
      <div className="relative overflow-hidden w-full py-4">
          <motion.div
            className="flex gap-4 sm:gap-6 md:gap-8"
            animate={{
              x: [0, -(testimonials.length * 400 + (testimonials.length - 1) * 32)], // Move by exactly half the duplicated width
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
          >
            {duplicatedTestimonials.map((testimonial, index) => (
              <motion.div
                key={`${testimonial.name}-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="flex-shrink-0 w-80 sm:w-96 md:w-[400px]"
              >
                <div className="flex flex-col items-start gap-4 sm:gap-6 rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 lg:p-8 text-left shadow-lg sm:shadow-xl shadow-blue-200/50 transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-300/50 h-full">
                  <div className="flex items-center gap-3 sm:gap-4 w-full">
                    <img
                      className="h-12 w-12 rounded-full object-cover sm:h-14 sm:w-14 lg:h-16 lg:w-16"
                      src={testimonial.avatarUrl}
                      alt={`Avatar of ${testimonial.name}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-base font-bold text-gray-800 sm:text-lg lg:text-xl">
                          {testimonial.name}
                        </p>
                        {testimonial.isVerified && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 sm:text-sm lg:text-base">
                        {testimonial.role}
                      </p>
                      {/* Star Rating */}
                      {testimonial.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${
                                i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
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
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
    </section>
  );
};

export default Testimonials;
