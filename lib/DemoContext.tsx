"use client";
import { createContext, useContext } from "react";
const DemoContext = createContext(false);
export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  return <DemoContext.Provider value={true}>{children}</DemoContext.Provider>;
}
export const useDemoData = () => useContext(DemoContext);
