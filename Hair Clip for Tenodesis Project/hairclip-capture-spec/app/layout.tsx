import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hair Clip Capture-to-Spec",
  description: "Phone-testable capture flow for generating detachable dual wing extender specs."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
