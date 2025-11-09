import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cartStore";
import { AuthProvider } from "@/lib/authStore";
import { OrdersProvider } from "@/lib/orderStore";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AIVRA",
  description: "Menu katalog AIVRA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased font-sans font-display`}>
        <AuthProvider>
          <OrdersProvider>
            <CartProvider>{children}</CartProvider>
          </OrdersProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
