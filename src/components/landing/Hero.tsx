'use client';

import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';

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
    <section className="relative px-4 pt-32 pb-16 sm:px-6 sm:pb-20 lg:px-10 lg:pb-24">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAlGiSkZMTII6wK8S-DDU6Z4mkN-JYGEpaDOQllMDodQ7GYkNzIecVIxip0ZZ4bi39-iMyUySleGLjop6Nf1gspy_a0xnmF1pjvamdEUUpZOBKJIsjfi5hbBKwbQWfVz-DSnmNh0sScEGpx6GA5TNgQytwzDByS0bwJJVFbcmf9GHR1TjF6Dlak83Honxc8_BNELP4H3KQT0NHc83rDifpsdoelob47ZO4jyq1cnUqDMRq1Rwr3FbZ-dDGS_s0TpNqFRU1DxuPKffU')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>
      <div className="z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 md:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-6 text-center md:text-left">
          <h1 className="text-5xl font-black tracking-tighter text-[var(--dark-blue)] sm:text-6xl lg:text-7xl">
                  Laundry &amp; dry cleaning with 24h delivery
                </h1>
          <p className="mx-auto max-w-lg text-xl font-normal text-[var(--medium-blue)] sm:text-2xl md:mx-0">
                  Free pickup and delivery service in Bahrain
                </p>
          <div className="mt-6 flex flex-col items-center gap-6 md:items-start">
            <p className="text-lg font-semibold text-gray-700">
                    Schedule your collection now!
                  </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => handleTimeSlotClick('earliest')}
                className="flex transform items-center justify-center gap-3 rounded-2xl border border-white/50 bg-white/40 px-6 py-4 text-gray-800 shadow-lg backdrop-blur-lg transition-all hover:-translate-y-1 hover:bg-white/60 hover:shadow-xl active:scale-95"
              >
                <span className="material-symbols-outlined text-3xl text-[var(--cyan-aqua)]">flash_on</span>
                <div className="text-left">
                  <span className="font-bold text-lg">EARLIEST</span>
                  <p className="text-sm">in the next 45min</p>
                </div>
              </button>

              <button
                onClick={() => handleTimeSlotClick('last')}
                className="flex transform items-center justify-center gap-3 rounded-2xl border border-white/50 bg-white/40 px-6 py-4 text-gray-800 shadow-lg backdrop-blur-lg transition-all hover:-translate-y-1 hover:bg-white/60 hover:shadow-xl active:scale-95"
              >
                <span className="material-symbols-outlined text-3xl text-gray-600">schedule</span>
                <div className="text-left">
                  <span className="font-bold text-lg">LAST</span>
                  <p className="text-sm">20:00 - 22:00</p>
                </div>
              </button>
            </div>
          </div>
        </div>
        <div className="relative h-[300px] w-full sm:h-[400px] lg:h-[500px]">
          <img className="absolute inset-0 h-full w-full rounded-3xl object-cover shadow-2xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlGiSkZMTII6wK8S-DDU6Z4mkN-JYGEpaDOQllMDodQ7GYkNzIecVIxip0ZZ4bi39-iMyUySleGLjop6Nf1gspy_a0xnmF1pjvamdEUUpZOBKJIsjfi5hbBKwbQWfVz-DSnmNh0sScEGpx6GA5TNgQytwzDByS0bwJJVFbcmf9GHR1TjF6Dlak83Honxc8_BNELP4H3KQT0NHc83rDifpsdoelob47ZO4jyq1cnUqDMRq1Rwr3FbZ-dDGS_s0TpNqFRU1DxuPKffU"/>
        </div>
      </div>
    </section>
  );
};

export default Hero;
