import Home from "@/components/Home";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bagy | Thời trang hiện đại",
  description: "Bagy - Cửa hàng thời trang trực tuyến",
  // other metadata
};

export default function HomePage() {
  return (
    <>
      <Home />
    </>
  );
}
