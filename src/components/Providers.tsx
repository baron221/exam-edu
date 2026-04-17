'use client';

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { LanguageProvider } from "@/context/LanguageContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <Toaster position="top-center" />
        {children}
      </LanguageProvider>
    </SessionProvider>
  );
}
