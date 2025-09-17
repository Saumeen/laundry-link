'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { RevealText, GradientText } from '@/components/shared/TextAnimations';
import { ParticleSystem } from '@/components/shared/ParticleSystem';

const Hero = () => {
  const router = useRouter();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1500], [0, -200]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  const handleTimeSlotClick = (slotType: string) => {
    const now = new Date();
    let timeParam = '';

    if (slotType === 'earliest') {
      const earliestTime = new Date(now.getTime() + 45 * 60000);
      timeParam = `earliest=${earliestTime.toISOString()}`;
    } else if (slotType === 'last') {
      timeParam = 'last=20:00-22:00';
    }

    router.push(`/customer/schedule?${timeParam}`);
  };

  return (
    <section
      className="relative w-full min-h-screen py-16 sm:py-20 lg:py-24 overflow-hidden"
    >
      {/* Enhanced Background with Parallax */}
      <motion.div 
        style={{ y, opacity }}
        className="absolute inset-0 overflow-hidden opacity-20"
      >
        <Image
          src="https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?q=80&w=2070&auto=format&fit=crop"
          alt="Laundry background"
          fill
          sizes="100vw"
          style={{ objectFit: 'cover' }}
          quality={80}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-blue-500/10" />
      </motion.div>

      {/* Particle System */}
      <ParticleSystem particleCount={30} className="opacity-30" />

      {/* Floating Elements */}
      <motion.div
        animate={{
          y: [0, -15, 0],
          rotate: [0, 3, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-20 right-20 w-16 h-16 bg-blue-400/15 rounded-full blur-xl"
      />
      <motion.div
        animate={{
          y: [0, 12, 0],
          rotate: [0, -2, 0],
          scale: [1, 0.9, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-32 left-16 w-24 h-24 bg-cyan-400/15 rounded-full blur-xl"
      />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-4 md:grid-cols-2 lg:gap-12 lg:px-0 h-full">
        <div className="flex flex-col gap-6 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          >
            <RevealText
              text="Laundry & dry cleaning with 24h delivery"
              className="text-5xl font-black tracking-tighter text-[var(--dark-blue)] sm:text-6xl lg:text-7xl"
              delay={0.2}
              stagger={0.1}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <GradientText
              text="Free pickup and delivery service in Bahrain"
              className="mx-auto max-w-lg text-xl font-normal sm:text-2xl md:mx-0"
              gradient="from-blue-600 via-purple-600 to-cyan-600"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="mt-6 flex flex-col items-center gap-6 md:items-start"
          >
            <motion.p 
              className="text-lg font-semibold text-gray-700"
              whileHover={{ scale: 1.05 }}
            >
              Schedule your collection now!
            </motion.p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <motion.button
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.4 }}
                whileHover={{
                  scale: 1.01,
                  rotateY: 1,
                  boxShadow: "0 10px 20px rgba(0,0,0,0.06)",
                  transition: {
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 0.8
                  }
                }}
                whileTap={{
                  scale: 0.98,
                  transition: {
                    type: "spring",
                    stiffness: 600,
                    damping: 20,
                    mass: 0.5
                  }
                }}
                onClick={() => handleTimeSlotClick('earliest')}
                className="group flex items-center justify-center gap-3 rounded-2xl border border-white/50 bg-white/40 px-6 py-4 text-gray-800 shadow-lg backdrop-blur-lg transition-all hover:-translate-y-1 hover:bg-white/60 hover:shadow-xl active:scale-95"
              >
                <motion.span 
                  className="material-symbols-outlined text-3xl text-[var(--cyan-aqua)]"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  flash_on
                </motion.span>
                <div className="text-left">
                  <span className="text-lg font-bold">EARLIEST</span>
                  <p className="text-sm">in the next 45min</p>
                </div>
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </motion.button>
              
              <motion.button
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.6 }}
                whileHover={{
                  scale: 1.01,
                  rotateY: -1,
                  boxShadow: "0 10px 20px rgba(0,0,0,0.06)",
                  transition: {
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 0.8
                  }
                }}
                whileTap={{
                  scale: 0.98,
                  transition: {
                    type: "spring",
                    stiffness: 600,
                    damping: 20,
                    mass: 0.5
                  }
                }}
                onClick={() => handleTimeSlotClick('last')}
                className="group flex items-center justify-center gap-3 rounded-2xl border border-white/50 bg-white/40 px-6 py-4 text-gray-800 shadow-lg backdrop-blur-lg transition-all hover:-translate-y-1 hover:bg-white/60 hover:shadow-xl active:scale-95"
              >
                <motion.span 
                  className="material-symbols-outlined text-3xl text-gray-600"
                  whileHover={{ rotate: 15 }}
                >
                  schedule
                </motion.span>
                <div className="text-left">
                  <span className="text-lg font-bold">LAST</span>
                  <p className="text-sm">20:00 - 22:00</p>
                </div>
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                />
              </motion.button>
            </div>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 100 }}
          className="relative h-[300px] w-full max-w-full sm:h-[400px] lg:h-[500px]"
          whileHover={{
            scale: 1.01,
            rotateY: 2,
            transition: {
              type: "spring",
              stiffness: 400,
              damping: 25,
              mass: 0.8
            }
          }}
        >
          <motion.div
            animate={{
              boxShadow: [
                "0 25px 50px rgba(0,0,0,0.1)",
                "0 35px 70px rgba(0,0,0,0.15)",
                "0 25px 50px rgba(0,0,0,0.1)"
              ]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="relative h-full w-full rounded-3xl overflow-hidden"
          >
            <Image
              src="https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?q=80&w=2070&auto=format&fit=crop"
              alt="Clean laundry"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-1000 hover:scale-105"
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
