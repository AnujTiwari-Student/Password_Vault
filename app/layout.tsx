import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { VaultProvider } from "@/context/active-vault-context";
import { MnemonicProvider } from "@/context/MnemonicContext";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Password Vault - Securely Store and Manage Your Passwords",
  description: "A secure password manager to store, organize, and manage your passwords with ease.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className="hydrated">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider session={session}>
          <MnemonicProvider>
            <VaultProvider>
              <SidebarProvider className="bg-gray-900">
                <main className="w-max flex-1">{children}</main>
                <Script src="https://checkout.razorpay.com/v1/checkout.js" />
                <Toaster />
              </SidebarProvider>
            </VaultProvider>
          </MnemonicProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
