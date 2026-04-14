"use client";

import { defaultSiteContent, fetchSiteContentPublic, normalizeSiteContent } from "@/lib/siteContent";
import type { SiteContent } from "@/types/siteContent";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type SiteContentContextValue = {
  content: SiteContent;
  loading: boolean;
  refresh: () => Promise<void>;
};

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

export function SiteContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const data = await fetchSiteContentPublic();
    setContent(normalizeSiteContent(data));
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo(
    () => ({
      content,
      loading,
      refresh,
    }),
    [content, loading],
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);

  if (!context) {
    throw new Error("useSiteContent must be used inside SiteContentProvider");
  }

  return context;
}
