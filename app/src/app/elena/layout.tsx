import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Elena - Exclusive Content",
  description: "Get exclusive access to Elena's private content. Free 7-day trial.",
  robots: "noindex, nofollow",
  openGraph: {
    title: "Elena - Exclusive Content",
    description: "Your secret escape 💋",
    type: "website",
  },
};

export default function ElenaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${cormorant.variable} ${inter.variable}`}>
      {children}
    </div>
  );
}
