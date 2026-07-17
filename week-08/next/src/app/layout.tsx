import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Course Registration Portal",
    template: "%s | Course Registration Portal"
  },
  description:
    "Cổng đăng ký học phần xây dựng bằng Next.js và GraphQL gateway."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <SiteHeader />
        <main>{children}</main>
        <footer className="border-t py-6">
          <div className="mx-auto max-w-6xl px-4 text-sm text-muted-foreground">
            Week 08 - Next.js frontend for GraphQL Gateway
          </div>
        </footer>
      </body>
    </html>
  );
}
