import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MSME Invoice Finance Marketplace",
  description:
    "Decentralized MSME invoice financing with Supabase + Next.js frontend",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
      >
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
