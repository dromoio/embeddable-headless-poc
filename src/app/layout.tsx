import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/ui/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "acme - POC",
  description: "Proof of concept application for acme",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-full flex-col antialiased`}
      >
        <Navbar />
        <main className="flex-1">
          <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
        <Toaster />
      </body>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.DROMO_WIDGET_OVERRIDE = "http://localhost:3000/";`,
        }}
      />
    </html>
  );
}
