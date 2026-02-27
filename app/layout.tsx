import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sustain Nexus | Environmental Law & Policy Assistant",
  description:
    "AI-powered environmental law assistant for EU regulations. Get instant, cited answers on EU ETS, CSRD, CBAM, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-display bg-background-light dark:bg-background-dark">
        {children}
      </body>
    </html>
  );
}
