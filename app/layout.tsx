import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "US Fencing | Backyard Privacy Fence Installation",
  description:
    "Scroll through the full backyard transformation — from unfenced property to a finished timber privacy fence, frame by frame.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
