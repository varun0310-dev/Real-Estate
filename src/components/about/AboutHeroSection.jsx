import React from 'react';

const AboutHeroSection = () => {
  return (
    <div className="relative w-full h-[180px] sm:h-[250px] md:h-[350px]   overflow-hidden">
      <img
        src="./src/assets/about/banner.avif"
        alt="Banner"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#4960B2]/10 to-[#4960B2]/90 flex items-center justify-center px-4 sm:px-6 md:px-10">
        <h1 className="text-white text-center text-xl sm:text-2xl md:text-4xl lg:text-5xl font-extrabold leading-tight sm:leading-snug drop-shadow-lg">
          Meet a team of <span className="text-primary-400">Results Driven</span>
          <br className="hidden sm:block" />
          Real-Estate Specialists
        </h1>
      </div>
    </div>
  );
};

export default AboutHeroSection;
