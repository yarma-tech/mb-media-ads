"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { Brand } from "@/lib/campaign-studio/workspace/types";
type PreviewData = {
  brands: Brand[];
  mediaUrls: Record<string, string>;
  thumbnailUrls?: Record<string, string>;
};
const context = createContext<PreviewData>({ brands: [], mediaUrls: {} });
export function PreviewDataProvider({
  data,
  children,
}: {
  data: PreviewData | null;
  children: ReactNode;
}) {
  return (
    <context.Provider value={data ?? { brands: [], mediaUrls: {} }}>
      {children}
    </context.Provider>
  );
}
export function usePreviewData() {
  return { data: useContext(context) };
}
