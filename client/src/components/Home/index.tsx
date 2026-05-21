"use client";
import React from "react";
import Categories from "./Categories";
import Collections from "./Collections";
import NewArrival from "./NewArrivals";
import BestSeller from "./BestSeller";
import Testimonials from "./Testimonials";
import Newsletter from "../Common/Newsletter";

import YodySlider from "./YodySlider";

const Home = () => {
  return (
    <main className="pt-0">
      <YodySlider />
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
