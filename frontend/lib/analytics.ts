type AnalyticsEventParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: string, params: AnalyticsEventParams = {}) {
  if (typeof window === "undefined") {
    return;
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }

  if (typeof window.fbq === "function") {
    window.fbq("trackCustom", eventName, params);
  }
}

export function trackLead(source: string, medium = "website") {
  trackEvent("lead", {
    source,
    medium,
  });

  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "Lead", { source, medium });
  }
}
