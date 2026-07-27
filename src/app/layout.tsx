import type { Metadata } from "next";
import { Libre_Bodoni } from "next/font/google";
import "./globals.css";

const libreBodoni = Libre_Bodoni({
  variable: "--font-latin-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Antonio",
  description: "个人知识与业务工作台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${libreBodoni.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#f7f7f5] text-stone-900">{children}</body>
    </html>
  );
}
