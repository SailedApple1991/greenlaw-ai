import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SustainNexus | ESG Regulatory Intelligence",
  description:
    "AI-powered ESG regulatory intelligence and sustainability strategy platform. Get instant, cited answers on EU ETS, CSRD, CBAM, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Lateef:wght@400;700&family=Manrope:wght@400;500;700;800&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;0,8..60,700;1,8..60,400;1,8..60,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-display bg-background-light dark:bg-background-dark">
        {children}
      </body>
    </html>
  );
}
