import fs from "fs";
import path from "path";
import matter from "gray-matter";

const guidesDirectory = path.join(process.cwd(), "content", "guides");

export type GuideSection = {
  title: string;
  content: string;
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

function getSections(value: unknown): GuideSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (section): section is GuideSection =>
      typeof section === "object" &&
      section !== null &&
      typeof section.title === "string" &&
      typeof section.content === "string",
  );
}

export function getGuideBySlug(slug: string): Guide {
  const fullPath = path.join(guidesDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data } = matter(fileContents);

  return {
    slug,
    title: typeof data.title === "string" ? data.title : slug,
    sections: getSections(data.sections),
  };
}
