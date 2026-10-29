"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

export type SiteLanguage = "ar" | "fr" | "en";
type LanguageContextValue = { language: SiteLanguage; setLanguage: (language: SiteLanguage) => void };
const LanguageContext = createContext<LanguageContextValue>({ language: "ar", setLanguage: () => {} });

export function GlobalLanguageProvider({ children }: { children: ReactNode }) {
  return <LanguageContext.Provider value={{ language: "ar", setLanguage: () => {} }}>{children}</LanguageContext.Provider>;
}

export function useSiteLanguage() {
  return useContext(LanguageContext);
}
