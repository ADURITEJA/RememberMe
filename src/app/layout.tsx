import type { Metadata } from "next";
import { Providers } from "@/components/auth/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Remme — Remember. Connect. Care.",
  description:
    "A calming companion for dementia care. Helps loved ones remember, stay safe, and stay connected.",
  applicationName: "Remme",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
