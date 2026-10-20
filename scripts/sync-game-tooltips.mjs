import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const guideDirectory = path.join(root, "content", "guides");
const farmDirectory = path.join(root, "content", "farms");
const generalGuidePath = path.join(root, "content", "werewolf-general.md");
const catalogPath = path.join(root, "data", "game-tooltips.json");
const imageDirectory = path.join(root, "public", "images", "game-tooltips");
const forceRefresh = process.argv.includes("--refresh");
const userIcons = new Map([
  ["shred", "/images/werewolf-skills/shred.webp"],
  ["lunar assault", "/images/werewolf-skills/lunar-assault.webp"],
  ["cross slash", "/images/werewolf-skills/cross-slash.webp"],
  ["lunar blessing", "/images/werewolf-skills/lunar-blessing.webp"],
  ["arctic howl", "/images/werewolf-skills/arctic-howl.webp"],
  ["pounce", "/images/werewolf-skills/pounce.webp"],
  ["herald of ice", "/images/werewolf-skills/herald-of-ice.webp"],
  ["eternal rage", "/images/werewolf-skills/eternal-rage.webp"],
  ["savage fury", "/images/werewolf-skills/savage-fury.webp"],
  ["mana remnants", "/images/werewolf-skills/mana-remnants.webp"],
  ["berserk", "/images/werewolf-skills/berserk.webp"],
]);
const nonEntityPhrases = new Set([
  "armour",
  "attack damage",
  "critical hit chance",
  "critical damage bonus",
  "energy shield",
  "life",
  "life regeneration",
  "mana",
  "maximum rage",
  "physical damage",
  "spell damage",
  "spirit",
  "strength",
  "intelligence",
  "dexterity",
  "fire damage",
  "cold damage",
  "lightning damage",
  "chaos resistance",
  "elemental resistance",
]);
const conciseFallbackDescriptions = new Map([
  ["absent amulet", "Grants one random Spirit skill at level 12: Cast on Elemental Ailment, Cast on Critical, Cast on Dodge, Rhoa Mount, Archmage, Trinity, or Eternal Rage\nThe granted skill does not cost you any Spirit\n-1 Prefix Modifier allowed\n-1 Suffix Modifier allowed"],
  ["dousing charm", "A charm that activates when you become Ignited."],
  ["thawing charm", "A charm that activates when you become Frozen and grants immunity to Freeze."],
  ["maji talisman", "Talisman base with +(7–10) to Maximum Rage."],
  ["spiny talisman", "Talisman base with 5% base weapon Critical Hit Chance."],
  ["dangerous blossom", "Gain 10% of Damage as Extra Physical Damage."],
  [
    "dimensional weakspot",
    "Hits have 15% chance to treat Enemy Monster Elemental Resistance values as inverted.",
  ],
  [
    "piercing claw",
    "Damage Penetrates 15% of Enemy Elemental Resistances while Shapeshifted.",
  ],
  [
    "greater ward rune",
    "+25 to maximum Runic Ward. Bonded: 15% increased Global Armour, Evasion and Energy Shield.",
  ],
  ["unset ring", "Grants 1 additional Skill Slot."],
  [
    "sacrifice of flesh",
    "When taking damage from Hits, prevent 20% of Life Loss, then lose 150% of Life Loss prevented this way over 4 seconds.",
  ],
]);
const fallbackEntities = new Map([
  [
    "absent amulet",
    {
      name: "Absent Amulet",
      type: "Amulet base",
      description:
        "Grants one random Spirit skill at level 12: Cast on Elemental Ailment, Cast on Critical, Cast on Dodge, Rhoa Mount, Archmage, Trinity, or Eternal Rage\nThe granted skill does not cost you any Spirit\n-1 Prefix Modifier allowed\n-1 Suffix Modifier allowed",
      image: "/images/game-tooltips/absent-amulet.webp",
      source: "https://poe2db.tw/Absent_Amulet",
    },
  ],
  [
    "legacy of wanderlust",
    {
      name: "Legacy of Wanderlust",
      type: "Item modifier",
      description:
        "Boots: Your speed is unaffected by Slows. Bonded modifier: 5% increased Movement Speed.",
      source: "https://poe2db.tw/us/Aldurs_Legacies",
    },
  ],
  [
    "sacrifice of flesh",
    {
      name: "Sacrifice of Flesh",
      type: "Keystone passive",
      description:
        "When taking damage from Hits, prevent 20% of Life Loss, then lose 150% of Life Loss prevented this way over 4 seconds.",
      source: "https://poe2db.tw/us/Undying_Hate",
    },
  ],
]);
// Hand-written text that always replaces PoE2DB's page summary for these bases.
const descriptionOverrides = new Map([
  ["absent amulet", "Grants one random Spirit skill at level 12: Cast on Elemental Ailment, Cast on Critical, Cast on Dodge, Rhoa Mount, Archmage, Trinity, or Eternal Rage\nThe granted skill does not cost you any Spirit\n-1 Prefix Modifier allowed\n-1 Suffix Modifier allowed"],
  ["unset ring", "Grants 1 additional Skill Slot"],
]);
const explicitEntityTypes = new Map([
  ["absent amulet", "Amulet base"],
  ["dousing charm", "Charm"],
  ["thawing charm", "Charm"],
  ["maji talisman", "Talisman base"],
  ["spiny talisman", "Talisman base"],
  ["rite of passage", "Charm"],
  ["legacy of wanderlust", "Item modifier"],
  ["greater ward rune", "Rune"],
  ["unset ring", "Ring base"],
  ["sacrifice of flesh", "Keystone passive"],
]);
const failedLookups = new Set();

function normalize(value) {
  return value
    .trim()
    .replace(/[’‘]/g, "'")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&#x0*27;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, number) =>
      String.fromCodePoint(Number(number)),
    );
}

function readMetaTags(html) {
  const tags = new Map();
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = new Map();
    for (const attribute of match[0].matchAll(
      /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g,
    )) {
      attributes.set(
        attribute[1].toLowerCase(),
        decodeHtml(attribute[2] ?? attribute[3] ?? attribute[4] ?? ""),
      );
    }

    const key = attributes.get("property") ?? attributes.get("name");
    const content = attributes.get("content");
    if (key && content) tags.set(key.toLowerCase(), content);
  }
  return tags;
}

function extractBoldNames(markdown) {
  const names = new Set();
  for (const match of markdown.matchAll(/\*\*([^*\n]+)\*\*/g)) {
    const name = match[1].trim();
    const wordCount = name.split(/\s+/).length;
    if (
      !name ||
      name.startsWith("[") ||
      name.includes("](") ||
      name.length > 70 ||
      wordCount > 5 ||
      /[.!?]$/.test(name) ||
      (/\d/.test(name) && !/\s+(?:i|ii|iii)$/i.test(name)) ||
      nonEntityPhrases.has(normalize(name))
    ) {
      continue;
    }
    names.add(name);
  }
  return [...names];
}

function slugify(name) {
  return normalize(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getPageType(html, description, requestedName) {
  const explicitType = explicitEntityTypes.get(normalize(requestedName));
  if (explicitType) return explicitType;

  const primaryClass = html.match(
    /<tr[^>]*>\s*<td>Class<\/td>\s*<td><a href=["']([^"']+)/i,
  )?.[1];
  const primaryId = html.match(
    /<tr[^>]*>\s*<td>ID<\/td>\s*<td>([^<]+)/i,
  )?.[1];

  if (/Support_Gems/i.test(primaryClass ?? "")) return "Support gem";
  if (/Skill_Gems/i.test(primaryClass ?? "")) return "Skill gem";
  if (/Unique_Items/i.test(primaryClass ?? "")) return "Unique item";
  if (/^Casts an aura\b/i.test(description) || /^Mark a target\b/i.test(description)) {
    return "Skill gem";
  }
  if (/^Hits which could potentially be a Critical Hit/i.test(description)) {
    return "Ascendancy passive";
  }
  if (/^Raven-Touched items\b/i.test(description)) return "Item mechanic";
  if (/Ascendancy:[\s\S]{0,100}Oracle/i.test(html)) return "Ascendancy passive";
  if (/^All Damage is taken from Mana before Life/i.test(description)) {
    return "Keystone passive";
  }
  if (/Oracle-only passive tree nodes/i.test(description)) {
    return "Ascendancy passive";
  }
  if (/passive_|PassiveSkillsHash|AscendancyID/i.test(`${primaryId} ${html}`)) {
    return "Passive skill";
  }
  const itemType = html.match(/<td>ItemType<\/td><td>([^<]+)/i)?.[1] ?? "";
  if (/SupportGem/i.test(itemType)) {
    return "Support gem";
  }
  if (/SkillGem/i.test(itemType)) {
    return "Skill gem";
  }
  if (/^Supports\b|^Culling Strikes\b|^Efficiency modifiers\b/i.test(description)) {
    return "Support gem";
  }
  if (/GenerationType.{0,150}Unique|Unique \(/i.test(html)) return "Unique item";
  if (/BaseType.{0,180}(Talisman|Amulet|Ring|Boots|Gloves|Helmet|Armour)/i.test(html)) {
    return "Item";
  }
  return "Game mechanic";
}

function isMatchingPage(title, requestedName) {
  const firstTitle = title.split(/\s+-\s+PoE2DB/i)[0].trim();
  const normalizedTitle = normalize(firstTitle);
  const normalizedName = normalize(requestedName);
  return (
    normalizedTitle === normalizedName ||
    normalizedTitle.startsWith(`${normalizedName} `)
  );
}

async function fetchEntry(name, existing) {
  const requestedTier = name.match(/^(.*)\s+(i|ii|iii)$/i);
  const lookupName = requestedTier && /^(ii|iii)$/i.test(requestedTier[2])
    ? `${requestedTier[1]} I`
    : name;
  // Prefer the Tier I gem ("Biting Frost I") over a passive or item that
  // shares the bare name; the article text keeps the unnumbered name.
  const candidateNames = /\s+i$/i.test(lookupName)
    ? [lookupName]
    : [`${lookupName} I`, lookupName];

  try {
    for (const candidateName of candidateNames) {
      const slug = candidateName.replace(/\s+/g, "_");
      const urls = [
        `https://poe2db.tw/us/${encodeURIComponent(slug)}`,
        `https://poe2db.tw/${encodeURIComponent(slug)}`,
      ];
      let page;

      for (const url of urls) {
        const response = await fetch(url, {
          headers: { Referer: "https://poe2db.tw/" },
          signal: AbortSignal.timeout(15000),
        });
        if (response.status >= 500 || response.status === 429) {
          failedLookups.add(normalize(name));
          return existing ?? fallbackEntities.get(normalize(name)) ?? null;
        }
        if (!response.ok) continue;
        const html = await response.text();
        const title = decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
        if (!isMatchingPage(title, candidateName)) continue;
        page = { url, html, title };
        break;
      }

      if (!page) continue;

      const { url, html, title } = page;
      const metadata = readMetaTags(html);
      let description =
        metadata.get("og:description") ?? metadata.get("description") ?? "";
      if (
        !description.trim() ||
        /path of exile is simply a tool to test your path of building creation/i.test(description)
      ) {
        description =
          conciseFallbackDescriptions.get(normalize(candidateName)) ??
          conciseFallbackDescriptions.get(normalize(name)) ??
          "";
      }
      if (!description.trim()) continue;

      const imageUrl = metadata.get("og:image");
      const iconRow = html.match(
        /<tr[^>]*>\s*<td>Icon<\/td>[\s\S]*?<\/tr>/i,
      )?.[0];
      const itemBoxImage = html.match(
        /<div\b[^>]*class=["'][^"']*itemboximage[^"']*["'][^>]*>[\s\S]*?<img\b[^>]*src=["']([^"']+)["']/i,
      )?.[1];
      const iconUrl = iconRow?.match(
        /(?:src|data-src)=["'](https:\/\/cdn\.poe2db\.tw\/image\/[^"']+)["']/i,
      )?.[1];
      const linkedImageUrl = [...html.matchAll(
        /<a\b[^>]*href=["'](https:\/\/cdn\.poe2db\.tw\/image\/[^"']+)["'][^>]*>([\s\S]{0,250}?)<\/a>/gi,
      )].map((match) => match[1]).find((url) => !/minimap/i.test(url));
      const resolvedImageUrl =
        imageUrl?.startsWith("https://cdn.poe2db.tw/image/")
          ? imageUrl
          : itemBoxImage ?? iconUrl ?? linkedImageUrl;
      const officialName = title.split(/\s+-\s+PoE2DB/i)[0].trim();
      const userIconName = normalize(officialName).replace(/\s+i$/i, "");
      let image = userIcons.get(normalize(name)) ?? userIcons.get(userIconName);

      if (!image && resolvedImageUrl) {
        const extension = path.extname(new URL(resolvedImageUrl).pathname) || ".webp";
        const imageName = `${slugify(officialName)}${extension}`;
        const imagePath = path.join(imageDirectory, imageName);
        try {
          const imageResponse = await fetch(resolvedImageUrl, {
            headers: { Referer: "https://poe2db.tw/" },
            signal: AbortSignal.timeout(15000),
          });
          if (imageResponse.ok && imageResponse.headers.get("content-type")?.startsWith("image/")) {
            await fs.writeFile(imagePath, new Uint8Array(await imageResponse.arrayBuffer()));
            image = `/images/game-tooltips/${imageName}`;
          }
        } catch {
          // Keep the text tooltip when the source image is temporarily unavailable.
        }
      }

      const curatedEntry = fallbackEntities.get(normalize(name));
      if (
        curatedEntry &&
        /place into an empty augment socket/i.test(description)
      ) {
        return { ...curatedEntry, ...(image ? { image } : {}) };
      }

      return {
        name: officialName,
        type: getPageType(html, description, candidateName),
        description: (
          descriptionOverrides.get(normalize(officialName)) ??
          descriptionOverrides.get(normalize(name)) ??
          description
        ).trim(),
        ...(image ? { image } : {}),
        source: url,
      };
    }

    return fallbackEntities.get(normalize(name)) ?? null;
  } catch {
    failedLookups.add(normalize(name));
    return existing ?? fallbackEntities.get(normalize(name)) ?? null;
  }
}

async function mapWithConcurrency(values, concurrency, callback) {
  const output = new Array(values.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      while (cursor < values.length) {
        const index = cursor++;
        output[index] = await callback(values[index]);
      }
    }),
  );
  return output;
}

await fs.mkdir(imageDirectory, { recursive: true });
await fs.mkdir(path.dirname(catalogPath), { recursive: true });

const markdownFiles = await fs.readdir(guideDirectory);
const contentPaths = markdownFiles
  .filter((file) => file.endsWith(".md"))
  .map((file) => path.join(guideDirectory, file));
const farmFiles = await fs
  .readdir(farmDirectory)
  .catch(() => []);
contentPaths.push(
  ...farmFiles
    .filter((file) => file.endsWith(".md"))
    .map((file) => path.join(farmDirectory, file)),
);
contentPaths.push(generalGuidePath);

const sourceTexts = await Promise.all(
  contentPaths.map((file) => fs.readFile(file, "utf8")),
);
const names = [...new Set(sourceTexts.flatMap(extractBoldNames))];
const previous = await fs
  .readFile(catalogPath, "utf8")
  .then((text) => JSON.parse(text))
  .catch(() => ({ entities: [] }));
const existingByName = new Map(
  (previous.entities ?? []).map((entity) => [normalize(entity.name), entity]),
);
const checkedNames = new Set((previous.checkedNames ?? []).map(normalize));
function tierOneName(name) {
  return name.replace(/\s+(?:ii|iii)$/i, " I");
}

const canonicalNames = new Set(
  names.flatMap((name) => {
    const normalizedTierOne = normalize(tierOneName(name));
    const normalizedName = normalize(name);
    return /\s+(?:i|ii|iii)$/i.test(name)
      ? [normalizedTierOne]
      : [normalizedName, `${normalizedName} i`];
  }),
);
const toFetch = names.filter((name) =>
  forceRefresh || !checkedNames.has(normalize(name)),
);

if (toFetch.length) {
  const fetched = await mapWithConcurrency(toFetch, 4, (name) =>
    fetchEntry(name, existingByName.get(normalize(name))),
  );
  for (const [index, entity] of fetched.entries()) {
    if (entity) existingByName.set(normalize(entity.name), entity);
    else if (forceRefresh) existingByName.delete(normalize(toFetch[index]));
  }
}

for (const name of names) {
  if (
    !failedLookups.has(normalize(name)) ||
    fallbackEntities.has(normalize(name))
  ) {
    checkedNames.add(normalize(name));
  }
}
const entities = [...existingByName.values()]
  .filter((entity) => {
    const entityName = normalize(entity.name);
    const titleMatch =
      canonicalNames.has(entityName) ||
      [...canonicalNames].some(
        (name) =>
          name.split(" ").length > 1 && entityName.startsWith(`${name} `),
      );
    return (
      titleMatch &&
      !/path of exile is simply a tool to test your path of building creation/i.test(
        entity.description,
      )
    );
  })
  .sort((first, second) => first.name.localeCompare(second.name));

await fs.writeFile(
  catalogPath,
  `${JSON.stringify(
    {
      source: "PoE2DB",
      sourceLicense: "CC BY-NC-SA 3.0",
      refreshedAt: new Date().toISOString(),
      checkedNames: [...checkedNames].sort(),
      entities,
    },
    null,
    2,
  )}\n`,
);

console.log(
  `PoE2DB tooltip catalog: ${entities.length} matched entities from ${names.length} bold names${toFetch.length ? ` (${toFetch.length} looked up)` : " (already current)"}.`,
);
