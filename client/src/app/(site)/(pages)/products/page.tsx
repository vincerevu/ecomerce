import React from "react";
import ShopWithSidebar from "@/components/ShopWithSidebar";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Products | Bagy",
  description: "Khám phá tất cả sản phẩm của Bagy",
};

const ProductsPage = () => {
  return (
    <main>
      <ShopWithSidebar />
    </main>
  );
};

export default ProductsPage;
