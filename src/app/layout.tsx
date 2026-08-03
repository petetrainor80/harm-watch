import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Harm Watch",
  description:
    "Report a website, forum or service you believe breaches the Online Safety Act 2023.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="fixed top-0 inset-x-0 h-[10px] bg-[#1d70b8] z-50" />
        {children}
        <div className="fixed bottom-0 inset-x-0 h-[10px] bg-[#1d70b8] z-50" />
      </body>
    </html>
  );
}
