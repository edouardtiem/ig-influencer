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
    title: "Elena ✨",
    description: "Your secret escape 💋",
    type: "website",
    images: [
      {
        url: "https://elenav.link/elena/teaser.png",
        width: 1200,
        height: 630,
        alt: "Elena",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elena ✨",
    description: "Your secret escape 💋",
    images: ["https://elenav.link/elena/teaser.png"],
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
