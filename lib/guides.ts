import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { renderArticleMarkdown } from "@/lib/markdown";

const guidesDirectory = path.join(process.cwd(), "content", "guides");

type GuideSectionData = {
  title: string;
  content: string;
};

export type GuideSection = {
  title: string;
  contentHtml: string;
};

export type Guide = {
  slug: string;
  title: string;
  image: string;
  class: string;
  tier: string;
  /** True while every section still holds placeholder copy. */
  isPlaceholder: boolean;
  sections: GuideSection[];
};

export type GuideGroup = {
  name: string;
  guides: Guide[];
};

type GuideGroupKey = "class" | "tier";

export const GUIDE_CLASS_ORDER = [
  "Huntress",
  "Mercenary",
  "Monk",
  "Sorceress",
  "Witch",
  "Warrior",
  "Druid",
  "Ranger",
  "Shadow",
  "Marauder",
  "Duelist",
  "Templar",
] as const;

export const GUIDE_TIER_ORDER = [
  "S+",
  "S",
  "A",
  "B",
  "C",
  "D",
  "F",
  "Unranked",
] as const;

const placeholderContent =
  /^(coming soon\.?|this is a placeholder guide for [^.]+\.?)$/i;

function isPlaceholderGuide(sections: GuideSectionData[]) {
  return sections.every((section) =>
    placeholderContent.test(section.content.trim()),
  );
}

/**
 * The id a section heading gets, so a guide's contents list can link to it
 * with "#section-title" (the sanitizer prefixes ids with "user-content-").
 */
export function getSectionId(title: string) {
  const slug = title
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `user-content-${slug}`;
}

/** "Tier A", or just "Unranked". */
export function formatTier(tier: string) {
  return tier === "Unranked" ? tier : `Tier ${tier}`;
}

export function getGuideSlugs() {
  return fs
    .readdirSync(guidesDirectory)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => fileName.replace(/\.md$/, ""))
    .sort((firstSlug, secondSlug) => firstSlug.localeCompare(secondSlug));
}

function getRequiredString(
  value: unknown,
  fieldName: string,
  fileName: string,
): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fileName}: "${fieldName}" must be a non-empty string.`);
  }

  return value;
}

function getSections(value: unknown, fileName: string): GuideSectionData[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fileName}: "sections" must be a list.`);
  }

  const sectionTitles = new Set<string>();

  return value.map((section, index) => {
    if (typeof section !== "object" || section === null) {
      throw new Error(`${fileName}: section ${index + 1} must be an object.`);
    }

    const sectionRecord = section as Record<string, unknown>;
    const title = getRequiredString(
      sectionRecord.title,
      `sections[${index}].title`,
      fileName,
    );
    const content = getRequiredString(
      sectionRecord.content,
      `sections[${index}].content`,
      fileName,
    );

    if (sectionTitles.has(title)) {
      throw new Error(`${fileName}: section title "${title}" is duplicated.`);
    }

    sectionTitles.add(title);
    return { title, content };
  });
}

async function renderSection(
  section: GuideSectionData,
  idPrefix: string,
): Promise<GuideSection> {
  return {
    title: section.title,
    contentHtml: await renderArticleMarkdown(section.content, idPrefix),
  };
}

export async function getGuideBySlug(slug: string): Promise<Guide> {
  const fullPath = path.join(guidesDirectory, `${slug}.md`);
  const fileName = path.relative(process.cwd(), fullPath);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data } = matter(fileContents);
  const sectionData = getSections(data.sections, fileName);
  const sections = await Promise.all(
    sectionData.map((section, index) =>
      renderSection(section, `${slug}-${index}`),
    ),
  );

  if ("slug" in data) {
    throw new Error(
      `${fileName}: remove "slug"; the Markdown filename is the canonical URL slug.`,
    );
  }

  const image = getRequiredString(data.image, "image", fileName);
  if (!image.startsWith("/") || image.includes("..")) {
    throw new Error(
      `${fileName}: "image" must be an absolute public path without ".." segments.`,
    );
  }

  const imagePath = path.join(process.cwd(), "public", image.slice(1));
  if (!fs.existsSync(imagePath)) {
    throw new Error(`${fileName}: image file not found at public${image}.`);
  }

  return {
    slug,
    title: getRequiredString(data.title, "title", fileName),
    image,
    class: getRequiredString(data.class, "class", fileName),
    tier: getRequiredString(data.tier, "tier", fileName),
    isPlaceholder: isPlaceholderGuide(sectionData),
    sections,
  };
}

export async function getAllGuides(): Promise<Guide[]> {
  const guides = await Promise.all(
    getGuideSlugs().map((slug) => getGuideBySlug(slug)),
  );

  return sortGuidesByTitle(guides);
}

export function sortGuidesByTitle(guides: Guide[]): Guide[] {
  return [...guides].sort((firstGuide, secondGuide) =>
    firstGuide.title.localeCompare(secondGuide.title),
  );
}

export function groupGuidesByMetadata(
  guides: Guide[],
  key: GuideGroupKey,
  preferredOrder: readonly string[],
): GuideGroup[] {
  const guidesByGroup = new Map<string, Guide[]>();

  for (const guide of guides) {
    const group = guidesByGroup.get(guide[key]) ?? [];
    group.push(guide);
    guidesByGroup.set(guide[key], group);
  }

  const preferredNames = new Set(preferredOrder);
  const remainingNames = [...guidesByGroup.keys()]
    .filter((name) => !preferredNames.has(name))
    .sort((firstName, secondName) => firstName.localeCompare(secondName));

  return [...preferredOrder, ...remainingNames]
    .filter((name) => guidesByGroup.has(name))
    .map((name) => ({
      name,
      guides: sortGuidesByTitle(guidesByGroup.get(name) ?? []),
    }));
}
