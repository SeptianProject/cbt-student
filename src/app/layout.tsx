import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Providers from "@/components/providers";
import ReduxProvider from "@/components/ReduxProvider";

export const metadata: Metadata = {
  title: "CBT - APP",
  description: "Sistem ujian online sekolah",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="font-sans antialiased">
        <ReduxProvider>
          <Providers>{children}</Providers>
        </ReduxProvider>
        <Analytics />
      </body>
    </html>
  );
}
