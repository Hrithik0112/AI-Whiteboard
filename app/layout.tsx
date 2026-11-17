import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";
import type { Metadata } from "next";
import Provider from './Provider';
import { AppearanceProvider } from '@/context/AppearanceContext';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from '@/components/ui/toast';

const inter = Inter({subsets:['latin'],variable:'--font-inter'});

export const metadata: Metadata = {
  title: 'Archflow — Give your ideas room to grow',
  description: 'Turn a thought into a diagram, map a flow, and sketch your next big idea. An open canvas with a little help from AI.',
};

const isClerkConfigured = 
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
  !!process.env.CLERK_SECRET_KEY;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!isClerkConfigured) {
    return (
      <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
        <body style={{ margin: 0, padding: 0 }}>
          <AppearanceProvider>{children}</AppearanceProvider>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
        <body style={{ margin: 0, padding: 0 }}>
          <Provider>
          {children}
          </Provider>
          <Toaster/>
        </body>
      </html>
    </ClerkProvider>
  );
}
