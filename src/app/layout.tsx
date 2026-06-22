import type { Metadata } from "next";
import {
  Anton,
  Bodoni_Moda,
  Geist_Mono,
  Hanken_Grotesk,
  Space_Grotesk,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const anton = Anton({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-anton",
  weight: "400",
});

const geistMono = Geist_Mono({
  display: "swap",
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const hankenGrotesk = Hanken_Grotesk({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-hanken-grotesk",
});

const bodoniModa = Bodoni_Moda({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-bodoni-moda",
});

export const metadata: Metadata = {
  title: "Prode Mundial 2026",
  description:
    "Base inicial del Prode Mundial 2026 para pronosticos privados.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-AR"
      className={`${anton.variable} ${spaceGrotesk.variable} ${hankenGrotesk.variable} ${bodoniModa.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
