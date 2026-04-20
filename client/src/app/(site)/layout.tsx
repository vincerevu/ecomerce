"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import "../css/euclid-circular-a-font.css";
import "../css/style.css";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

import { CartModalProvider } from "../context/CartSidebarModalContext";
import { ReduxProvider } from "@/redux/provider";
import CartSidebarModal from "@/components/Common/CartSidebarModal";
import { PreviewSliderProvider } from "../context/PreviewSliderContext";
import PreviewSliderModal from "@/components/Common/PreviewSlider";

import ScrollToTop from "@/components/Common/ScrollToTop";
import PreLoader from "@/components/Common/PreLoader";
import CartHydrator from "@/components/Common/CartHydrator";

import ChatBot from "@/components/ChatBot";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState<boolean>(true);
  const pathname = usePathname();
  const hideFooter = pathname?.startsWith("/my-account");

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }, [pathname, loading]);

  return (
    <html lang="vi" suppressHydrationWarning={true}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning={true}>
        {loading ? (
          <PreLoader />
        ) : (
          <>
            <ReduxProvider>
              <AuthProvider>
                <CartModalProvider>
                  <PreviewSliderProvider>
                    <CartHydrator />
                    <Header />
                    {children}

                    <CartSidebarModal />
                    <PreviewSliderModal />
                    <ChatBot />
                  </PreviewSliderProvider>
                </CartModalProvider>
              </AuthProvider>
            </ReduxProvider>
            <ScrollToTop />
            {!hideFooter && <Footer />}
          </>
        )}
      </body>
    </html>
  );
}
