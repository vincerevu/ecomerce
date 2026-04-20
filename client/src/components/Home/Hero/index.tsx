import React from "react";
import HeroCarousel from "./HeroCarousel";
import HeroFeature from "./HeroFeature";
import Image from "next/image";
const Hero = () => {
  return (
    <section className="overflow-hidden pb-10 lg:pb-12.5 xl:pb-15 pt-57.5 sm:pt-45 lg:pt-30 xl:pt-51.5 bg-[#E5EAF4]">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="relative z-1 rounded-[10px] bg-white overflow-hidden">
          <Image
            src="https://plus.unsplash.com/premium_photo-1673356301535-ca73c75abf14?w=800&q=80"
            alt="hero bg shapes"
            className="absolute right-0 bottom-0 -z-1 object-cover w-full h-full"
            fill
          />
          <div className="xl:max-w-[757px] w-full">
            <HeroCarousel />
          </div>
        </div>
      </div>

      {/* <!-- Hero features --> */}
      <HeroFeature />
    </section>
  );
};

export default Hero;
