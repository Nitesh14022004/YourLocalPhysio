import { BASE_URL, apiFetch } from "@/lib/api";
import type { SiteContent } from "@/types/siteContent";

export const defaultSiteContent: SiteContent = {
  siteName: "Your Local Physio",
  logoText: "YL",
  logoImageUrl: "",
  heroTitle: "Expert Physiotherapy at Your Home",
  heroSubtitle: "Personalized treatment without hospital visits",
  primaryPhone: "8431369056",
  whatsappNumber: "918431369056",
  serviceArea: "Bangalore home visits",
};

function sanitizePhone(value: unknown, fallback: string) {
  const str = typeof value === "string" ? value.replace(/\s+/g, "") : "";
  return /^\+?[0-9]{7,15}$/.test(str) ? str : fallback;
}

export function normalizeSiteContent(input: unknown): SiteContent {
  const payload = (input && typeof input === "object" ? input : {}) as Partial<SiteContent>;

  return {
    siteName:
      typeof payload.siteName === "string" && payload.siteName.trim()
        ? payload.siteName.trim().slice(0, 60)
        : defaultSiteContent.siteName,
    logoText:
      typeof payload.logoText === "string" && payload.logoText.trim()
        ? payload.logoText.trim().slice(0, 8)
        : defaultSiteContent.logoText,
    logoImageUrl:
      typeof payload.logoImageUrl === "string" ? payload.logoImageUrl.trim().slice(0, 500) : "",
    heroTitle:
      typeof payload.heroTitle === "string" && payload.heroTitle.trim()
        ? payload.heroTitle.trim().slice(0, 120)
        : defaultSiteContent.heroTitle,
    heroSubtitle:
      typeof payload.heroSubtitle === "string" && payload.heroSubtitle.trim()
        ? payload.heroSubtitle.trim().slice(0, 180)
        : defaultSiteContent.heroSubtitle,
    primaryPhone: sanitizePhone(payload.primaryPhone, defaultSiteContent.primaryPhone),
    whatsappNumber: sanitizePhone(payload.whatsappNumber, defaultSiteContent.whatsappNumber),
    serviceArea:
      typeof payload.serviceArea === "string" && payload.serviceArea.trim()
        ? payload.serviceArea.trim().slice(0, 80)
        : defaultSiteContent.serviceArea,
  };
}

export async function fetchSiteContentPublic(): Promise<SiteContent> {
  try {
    const response = await fetch(`${BASE_URL}/api/site-content`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return defaultSiteContent;
    }

    const data = (await response.json().catch(() => null)) as unknown;
    return normalizeSiteContent(data);
  } catch {
    return defaultSiteContent;
  }
}

export async function fetchSiteContentAdmin(): Promise<SiteContent> {
  const response = await apiFetch(`${BASE_URL}/api/admin/site-content`, {
    method: "GET",
  });

  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error("Failed to load site content");
  }

  return normalizeSiteContent(data);
}

export async function saveSiteContentAdmin(content: SiteContent): Promise<SiteContent> {
  const response = await apiFetch(`${BASE_URL}/api/admin/site-content`, {
    method: "PUT",
    body: JSON.stringify(content),
  });

  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error("Failed to save site content");
  }

  return normalizeSiteContent(data);
}
