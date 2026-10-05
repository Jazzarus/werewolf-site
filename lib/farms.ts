import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const farmsDirectory = path.join(process.cwd(), "content", "farms");

export const FARM_TIER_ORDER = ["S", "A", "B", "C", "D", "F"] as const;

export type Farm = {
  slug: string;
  title: string;
  tier: (typeof FARM_TIER_ORDER)[number];
  strategyHtml: string;
};

function getFarmSlugs() {
  if (!fs.existsSync(farmsDirectory)) return [];

  return fs
    .readdirSync(farmsDirectory)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => fileName.replace(/\.md$/, ""))
    .sort((firstSlug, secondSlug) => firstSlug.localeCompare(secondSlug));
}

function getRequiredString(
  value: unknown,
  fieldName: string,
  fileName: string,
) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fileName}: "${fieldName}" must be a non-empty string.`);
  }

  return value;
}

async function getFarmBySlug(slug: string): Promise<Farm> {
  const fullPath = path.join(farmsDirectory, `${slug}.md`);
  const fileName = path.relative(process.cwd(), fullPath);
  const { data } = matter(fs.readFileSync(fullPath, "utf8"));
  const tier = getRequiredString(data.tier, "tier", fileName);

  if (!FARM_TIER_ORDER.includes(tier as Farm["tier"])) {
    throw new Error(
      `${fileName}: "tier" must be one of ${FARM_TIER_ORDER.join(", ")}.`,
    );
  }

  const strategy = getRequiredString(data.strategy, "strategy", fileName);
  const renderedStrategy = await remark().use(html).process(strategy);

  return {
    slug,
    title: getRequiredString(data.title, "title", fileName),
    tier: tier as Farm["tier"],
    strategyHtml: renderedStrategy.toString(),
  };
}

export async function getAllFarms(): Promise<Farm[]> {
  const farms = await Promise.all(getFarmSlugs().map(getFarmBySlug));

  return farms.sort((firstFarm, secondFarm) =>
    firstFarm.title.localeCompare(secondFarm.title),
  );
}
