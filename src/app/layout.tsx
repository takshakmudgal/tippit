import type { Metadata } from "next";
import localFont from "next/font/local";
import { Header } from "@/components/common/Header";
import { Providers } from "@/providers";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "tippit.xyz | Tip community work and projects",
  description:
    "Tip and support community work and projects on the blockchain with tippit.xyz",
  metadataBase: new URL("https://tippit.xyz"),
  openGraph: {
    title: "tippit.xyz",
    description:
      "Tip and support community work and projects on the blockchain",
    url: "https://tippit.xyz",
    siteName: "tippit.xyz",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "tippit.xyz",
    description:
      "Tip and support community work and projects on the blockchain",
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-[#121313]">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#121313] text-foreground h-full flex flex-col`}
      >
        <Providers>
          <Header />
          <div className="flex-1">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
