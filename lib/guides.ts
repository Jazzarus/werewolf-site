import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const guidesDirectory = path.join(process.cwd(), "content", "guides");

export type Guide = {
  slug: string;
  title: string;
  contentHtml: string;
};

export function getGuideSlugs() {
  return fs
    .readdirSync(guidesDirectory)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => fileName.replace(/\.md$/, ""));
}

export async function getGuideBySlug(slug: string): Promise<Guide> {
  const fullPath = path.join(guidesDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { content, data } = matter(fileContents);
  const processedContent = await remark().use(html).process(content);

  return {
    slug,
    title: typeof data.title === "string" ? data.title : slug,
    contentHtml: processedContent.toString(),
  };
}
