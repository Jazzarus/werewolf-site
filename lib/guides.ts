import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

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
  sections: GuideSection[];
};

export function getGuideSlugs() {
  return fs
    .readdirSync(guidesDirectory)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => fileName.replace(/\.md$/, ""));
}

function getSections(value: unknown): GuideSectionData[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (section): section is GuideSectionData =>
      typeof section === "object" &&
      section !== null &&
      typeof section.title === "string" &&
      typeof section.content === "string",
  );
}

async function renderSection(section: GuideSectionData): Promise<GuideSection> {
  const processedContent = await remark()
    .use(html, { sanitize: false })
    .process(section.content);

  return {
    title: section.title,
    contentHtml: processedContent.toString(),
  };
}

export async function getGuideBySlug(slug: string): Promise<Guide> {
  const fullPath = path.join(guidesDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data } = matter(fileContents);
  const sections = await Promise.all(
    getSections(data.sections).map(renderSection),
  );

  return {
    slug,
    title: typeof data.title === "string" ? data.title : slug,
    sections,
  };
}
