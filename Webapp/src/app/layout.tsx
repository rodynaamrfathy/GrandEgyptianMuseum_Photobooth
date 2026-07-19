import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GEM Photobooth",
  description: "Create and share your custom GEM photobooth memories.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "GEM Photobooth",
    description: "Create and share your custom GEM photobooth memories.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
