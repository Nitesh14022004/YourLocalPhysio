import { promises as fs } from "fs";
import path from "path";

export type SiteContent = {
  siteName: string;
  logoText: string;
  logoImageUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryPhone: string;
  whatsappNumber: string;
  serviceArea: string;
};

const defaultSiteContent: SiteContent = {
  siteName: "Your Local Physio",
  logoText: "YL",
  logoImageUrl: "",
  heroTitle: "Expert Physiotherapy at Your Home",
  heroSubtitle: "Personalized treatment without hospital visits",
  primaryPhone: "8431369056",
  whatsappNumber: "918431369056",
  serviceArea: "Bangalore home visits",
};

const storagePath = path.resolve(process.cwd(), "data", "site-content.json");
const revisionsDirectoryPath = path.resolve(process.cwd(), "data", "site-content-revisions");

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

async function ensureStorageDirectory() {
  await fs.mkdir(path.dirname(storagePath), { recursive: true });
  await fs.mkdir(revisionsDirectoryPath, { recursive: true });
}

function createRevisionFileName() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${stamp}.json`;
}

async function writeRevisionSnapshot(content: SiteContent) {
  const revisionFilePath = path.join(revisionsDirectoryPath, createRevisionFileName());
  await fs.writeFile(revisionFilePath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
}

export async function getSiteContentRevisions() {
  await ensureStorageDirectory();

  const entries = await fs.readdir(revisionsDirectoryPath, { withFileTypes: true });

  const revisionFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a));

  return revisionFiles;
}

export async function getSiteContent() {
  try {
    const raw = await fs.readFile(storagePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return normalizeSiteContent(parsed);
  } catch {
    return defaultSiteContent;
  }
}

export async function saveSiteContent(input: unknown) {
  const content = normalizeSiteContent(input);

  await ensureStorageDirectory();
  await writeRevisionSnapshot(content);
  await fs.writeFile(storagePath, `${JSON.stringify(content, null, 2)}\n`, "utf8");

  return content;
}
