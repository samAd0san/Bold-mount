import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bold Mount | Sunnah Superfood - Talbeenah, Dates & Honey",
  description: "Nourish Your Body, Relieve Your Heart with authentic Talbeenah, premium dates, and natural honey. Experience the Sunnah Superfood that restores vitality and calms the soul.",
  keywords: ["Talbeenah", "Sunnah", "Superfood", "Dates", "Honey", "Islamic Nutrition", "Bold Mount"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={rubik.variable}>
      <body className="font-[family-name:var(--font-rubik)] antialiased">
        {children}
      </body>
    </html>
  );
}
