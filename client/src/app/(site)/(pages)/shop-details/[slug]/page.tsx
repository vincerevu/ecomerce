import React from "react";
import ShopDetails from "@/components/ShopDetails";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Details Page | Bagy",
  description: "This is Shop Details Page for NextCommerce Template",
};

type ShopDetailsSlugPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const ShopDetailsSlugPage = async ({ params }: ShopDetailsSlugPageProps) => {
  const { slug } = await params;

  return (
    <main>
      <ShopDetails slug={slug} />
    </main>
  );
};

export default ShopDetailsSlugPage;
