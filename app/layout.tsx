import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/Providers";
import { AuthHeader } from "@/components/AuthHeader";
import { RedirectIfNoAvatar } from "@/components/RedirectIfNoAvatar";
import "./globals.css";

const advercase = localFont({
  src: [
    {
      path: "../public/fonts/AdvercaseFont-Demo-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/AdvercaseFont-Demo-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-advercase",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Reizoko",
  description: "Sticky notes, chore charts, and cost splitting in real-time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${advercase.variable} font-sans antialiased`}>
        <Providers>
          {/* <RedirectIfNoAvatar /> */}
          {/* <AuthHeader /> */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
