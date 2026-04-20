"use client";
import React from "react";
import Categories from "./Categories";
import Collections from "./Collections";
import NewArrival from "./NewArrivals";
import BestSeller from "./BestSeller";
import Testimonials from "./Testimonials";
import Newsletter from "../Common/Newsletter";

const Home = () => {
  return (
    <main className="pt-[150px] sm:pt-[162px] lg:pt-[172px]">
      <Collections />
      <Categories />
      <NewArrival />
      <BestSeller />
      <Testimonials />
      <Newsletter />
    </main>
  );
};

export default Home;
