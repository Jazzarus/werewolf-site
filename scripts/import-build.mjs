/**
 * Imports a Path of Building export into data/builds/<slug>.json, which the
 * guides render as a gear box and gem setup cards.
 *
 *   node scripts/import-build.mjs oracle-full-endgame https://poe.ninja/poe2/pob/25481
 *   node scripts/import-build.mjs oracle-full-endgame --file build.xml
 *
 * Item icons are not part of a Path of Building export. They live in
 * public/images/build-items/ and are kept from the previous import when an
 * item's name and base match, so re-importing an updated build only needs
 * icons for items that changed.
 */
import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [slug, source, maybeFile] = process.argv.slice(2);

if (!slug || !source) {
  console.error("Usage: node scripts/import-build.mjs <slug> <poe.ninja url | --file build.xml>");
  process.exit(1);
}

const outputPath = path.join(root, "data", "builds", `${slug}.json`);

function decodeEntities(value) {
  return value
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function readAttributes(tag) {
  const attributes = {};
  for (const match of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) {
    attributes[match[1]] = decodeEntities(match[2]);
  }
  return attributes;
}

async function loadXml() {
  if (source === "--file") return fs.readFile(maybeFile, "utf8");

  const url = new URL(source);
  const code = url.pathname.split("/").filter(Boolean).at(-1);
  const response = await fetch(`https://poe.ninja/poe2/pob/raw/${code}`);
  if (!response.ok) throw new Error(`poe.ninja answered ${response.status}`);
  const encoded = (await response.text()).trim().replace(/-/g, "+").replace(/_/g, "/");
  return zlib.inflateSync(Buffer.from(encoded, "base64")).toString("utf8");
}

const propertyNames = ["Armour", "Evasion", "Energy Shield", "Quality"];

function parseItem(text) {
  const lines = decodeEntities(text.replace(/<ModRange[^>]*\/>/g, ""))
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rarity = lines.shift().replace(/^Rarity:\s*/i, "").toLowerCase();
  const name = lines.shift();
  // Magic and normal items have a single name line that includes the base.
  const base = rarity === "magic" || rarity === "normal" ? name : lines.shift();

  const item = {
    name,
    base,
    rarity,
    properties: [],
    runes: [],
    enchants: [],
    runeMods: [],
    implicits: [],
    explicits: [],
    corrupted: false,
  };

  let implicitCount = 0;
  let index = 0;
  for (; index < lines.length; index++) {
    const line = lines[index];
    const [key, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    if (propertyNames.includes(key)) {
      if (!(key === "Quality" && value === "0")) item.properties.push([key, value]);
    } else if (key === "Rune") {
      item.runes.push(value);
    } else if (key === "Implicits") {
      implicitCount = Number(value);
      index++;
      break;
    }
  }

  const modLines = lines.slice(index);
  modLines.forEach((line, position) => {
    if (line === "Corrupted") {
      item.corrupted = true;
      return;
    }
    const tags = [...line.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);
    const textValue = line.replace(/\{\w+\}/g, "").trim();
    if (position < implicitCount) {
      if (tags.includes("rune")) item.runeMods.push(textValue);
      else if (tags.includes("enchant")) item.enchants.push(textValue);
      else item.implicits.push(textValue);
    } else {
      const kind = ["fractured", "desecrated"].find((tag) => tags.includes(tag));
      item.explicits.push(kind ? { text: textValue, kind } : { text: textValue });
    }
  });

  return item;
}

const xml = await loadXml();
const build = readAttributes(xml.match(/<Build\b[^>]*>/)[0]);

const items = new Map();
for (const match of xml.matchAll(/<Item id="(\d+)">([\s\S]*?)<\/Item>/g)) {
  items.set(match[1], parseItem(match[2]));
}

let previousIcons = new Map();
let previousSource;
let previousTitle;
try {
  const previous = JSON.parse(await fs.readFile(outputPath, "utf8"));
  previousSource = previous.source;
  previousTitle = previous.title;
  const all = [...previous.slots, ...previous.jewels].map((entry) => entry.item);
  previousIcons = new Map(all.filter((item) => item.icon).map((item) => [`${item.name}|${item.base}`, item.icon]));
} catch {
  // First import.
}

function withIcon(item) {
  const icon = previousIcons.get(`${item.name}|${item.base}`);
  return icon ? { ...item, icon } : item;
}

const itemSet = xml.match(/<ItemSet\b[^>]*>([\s\S]*?)<\/ItemSet>/)?.[1] ?? "";
const slots = [];
const jewels = [];
for (const match of itemSet.matchAll(/<Slot\b[^>]*\/>/g)) {
  const { name, itemId } = readAttributes(match[0]);
  if (!itemId || itemId === "0" || /Swap$/.test(name)) continue;
  const item = withIcon(items.get(itemId));
  if (/Jewel Socket/.test(name)) jewels.push({ location: name.replace(/ Jewel Socket \d+$/, ""), item });
  else slots.push({ slot: name, item });
}
for (const match of xml.matchAll(/<Socket\b[^>]*nodeId="\d+"[^>]*\/>/g)) {
  const { itemId } = readAttributes(match[0]);
  if (itemId && itemId !== "0") jewels.push({ location: "Passive Tree", item: withIcon(items.get(itemId)) });
}

const skillSet = xml.match(/<SkillSet\b[^>]*>([\s\S]*?)<\/SkillSet>/)?.[1] ?? "";
const skills = [];
for (const match of skillSet.matchAll(/<Skill\b[^>]*>([\s\S]*?)<\/Skill>/g)) {
  const gems = [...match[1].matchAll(/<Gem\b[^>]*\/>/g)]
    .map((gem) => readAttributes(gem[0]))
    .filter((gem) => gem.nameSpec && gem.enabled !== "false")
    .map((gem) => ({
      name: gem.nameSpec,
      level: Number(gem.level),
      quality: Number(gem.quality),
      support: /SupportGem/i.test(gem.gemId ?? ""),
    }));
  if (gems.length > 0) skills.push({ gems });
}

const output = {
  source: source === "--file" ? previousSource : source,
  // The box heading, e.g. "Full Endgame"; edit it in the JSON, imports keep it.
  title: previousTitle,
  character: {
    className: build.className,
    ascendancy: build.ascendClassName,
    level: Number(build.level),
  },
  slots,
  jewels,
  skills,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);

const missingIcons = [...slots, ...jewels].filter((entry) => !entry.item.icon);
console.log(`Wrote ${path.relative(root, outputPath)}: ${slots.length} items, ${jewels.length} jewels, ${skills.length} skills.`);
if (missingIcons.length) {
  console.log(`Add icons for: ${missingIcons.map((entry) => entry.item.name).join(", ")}`);
}
