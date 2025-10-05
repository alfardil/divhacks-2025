import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gavel",
  description: "LLM evaluation system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism-tomorrow.min.css"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <script
          src="https://cdn.jsdelivr.net/npm/prismjs@1/components/prism-core.min.js"
          defer
        ></script>
        <script
          src="https://cdn.jsdelivr.net/npm/prismjs@1/plugins/autoloader/prism-autoloader.min.js"
          defer
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.Prism=window.Prism||{};Prism.plugins.autoloader.languages_path='https://cdn.jsdelivr.net/npm/prismjs@1/components/';",
          }}
        />
      </body>
    </html>
  );
}
