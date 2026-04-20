"use client";

import { hydrateCartFromServer } from "@/libs/cart-sync";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const CartHydrator = () => {
  const pathname = usePathname();

  useEffect(() => {
    hydrateCartFromServer().catch((error) => {
      console.error("Không thể đồng bộ giỏ hàng từ server", error);
    });
  }, [pathname]);

  return null;
};

export default CartHydrator;
