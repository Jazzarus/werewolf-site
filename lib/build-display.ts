import fs from "node:fs";
import path from "node:path";

/* ---------------------------------------------------------------------------
 * Build boxes for guides, fed by data/builds/<slug>.json
 * (see scripts/import-build.mjs). In a guide's Markdown:
 *
 *   ::build-gear[oracle-full-endgame]   the equipped items, hoverable
 *   ::build-gems[oracle-full-endgame]   the gem setups as setup cards
 * ------------------------------------------------------------------------- */

type ItemMod = { text: string; kind?: "fractured" | "desecrated" };

export type BuildItem = {
  name: string;
  base: string;
  rarity: string;
  properties: [string, string][];
  runes: string[];
  enchants: string[];
  runeMods: string[];
  implicits: string[];
  explicits: ItemMod[];
  corrupted: boolean;
  icon?: string;
};

type BuildGem = { name: string; level: number; quality: number; support: boolean };

export type BuildData = {
  source?: string;
  title?: string;
  character: { className: string; ascendancy: string; level: number };
  slots: { slot: string; item: BuildItem }[];
  jewels: { location: string; item: BuildItem }[];
  skills: { gems: BuildGem[] }[];
};

type HastNode = {
  type: "text" | "element";
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const buildDirectory = path.join(process.cwd(), "data", "builds");

function loadBuild(slug: string): BuildData {
  const filePath = path.join(buildDirectory, `${slug}.json`);
  if (!/^[a-z0-9-]+$/.test(slug) || !fs.existsSync(filePath)) {
    throw new Error(`Build "${slug}" not found in data/builds/.`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as BuildData;
}

/* ----------------------------- Gem setups ------------------------------- */

/** Main skills first, in the order the guides discuss them. */
const skillOrder = [
  "shred",
  "lunar assault",
  "pounce",
  "arctic howl",
  "cross slash",
  "lunar blessing",
  "herald of ice",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function gemSetupMarkdown(build: BuildData) {
  // Every other gem in the group is listed under the skill: its supports, and
  // a mark or similar skill gem linked to it. A group that repeats an earlier
  // one (the same skill from an item and from a gem) is shown once.
  const seen = new Set<string>();
  const groups = build.skills
    .map((skill) => {
      const main = skill.gems.find((gem) => !gem.support);
      return main ? { main, supports: skill.gems.filter((gem) => gem !== main) } : null;
    })
    .filter((group): group is NonNullable<typeof group> => Boolean(group))
    // A skill on its own (an amulet's granted Eternal Rage) has no setup to show.
    .filter(({ supports }) => supports.length > 0)
    .filter(({ main, supports }) => {
      const key = [main, ...supports].map((gem) => gem.name).join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const rank = (name: string) => {
    const index = skillOrder.indexOf(name.toLowerCase());
    return index === -1 ? skillOrder.length : index;
  };
  groups.sort((first, second) => rank(first.main.name) - rank(second.main.name));

  return groups
    .map(({ main, supports }) =>
      [
        `- **${main.name}** {#setup-${slugify(main.name)}}`,
        ...supports.map((gem) => `  - **${gem.name}**`),
      ].join("\n"),
    )
    .join("\n");
}

/** Swaps "::build-gems[slug]" lines for setup-card Markdown before parsing. */
export function expandBuildGems(markdown: string) {
  return markdown.replace(/^::build-gems\[([a-z0-9-]+)\]\s*$/gm, (_, slug: string) =>
    gemSetupMarkdown(loadBuild(slug)),
  );
}

/* ------------------------------- Gear box ------------------------------- */

/**
 * Inventory placement, and where each item card opens: beside the slot,
 * towards the open side of the box ("start" opens to the right), hanging
 * down from the top rows and rising from the bottom rows so it stays in view.
 */
type CardSide = { x: "start" | "end"; y: "top" | "bottom" };
const slotLayout: Record<string, { key: string } & CardSide> = {
  "Weapon 1": { key: "weapon", x: "start", y: "top" },
  "Weapon 2": { key: "offhand", x: "end", y: "top" },
  Helmet: { key: "helmet", x: "start", y: "top" },
  "Body Armour": { key: "body", x: "start", y: "top" },
  Amulet: { key: "amulet", x: "end", y: "top" },
  "Ring 1": { key: "ring1", x: "start", y: "top" },
  "Ring 2": { key: "ring2", x: "end", y: "top" },
  Gloves: { key: "gloves", x: "start", y: "bottom" },
  Belt: { key: "belt", x: "start", y: "bottom" },
  Boots: { key: "boots", x: "end", y: "bottom" },
  "Flask 1": { key: "flask1", x: "start", y: "bottom" },
  "Flask 2": { key: "flask2", x: "start", y: "bottom" },
  "Charm 1": { key: "charm1", x: "start", y: "bottom" },
  "Charm 2": { key: "charm2", x: "start", y: "bottom" },
  "Charm 3": { key: "charm3", x: "end", y: "bottom" },
};

export const buildGearClassNames = [
  "buildGear",
  "buildGearHeader",
  "buildGearTitle",
  "buildGearMeta",
  "buildGearSource",
  "buildGearGrid",
  "buildGearJewels",
  "buildGearJewelsLabel",
  "buildGearJewelList",
  "buildSlot",
  "buildSlotEmpty",
  "buildSlotIcon",
  "buildSlotStart",
  "buildSlotEnd",
  "buildSlotTop",
  "buildSlotBottom",
  ...Object.values(slotLayout).map(({ key }) => `buildSlot-${key}`),
  "buildSlot-jewel",
  "gameTerm-rare",
  "gameTerm-magic",
  "gameTerm-relic",
  "gameTooltip-rare",
  "gameTooltip-magic",
  "gameTooltip-relic",
  "gameTooltip-item",
  "gameTooltipBase",
  "gameTooltipProperty",
  "gameTooltipValue",
  "gameTooltipLine-enchant",
  "gameTooltipLine-rune",
  "gameTooltipLine-implicit",
  "gameTooltipLine-fractured",
  "gameTooltipLine-desecrated",
  "gameTooltipLine-corrupted",
  "gameTooltipSockets",
];

const text = (value: string): HastNode => ({ type: "text", value });
const element = (
  tagName: string,
  properties: Record<string, unknown>,
  children: HastNode[] = [],
): HastNode => ({ type: "element", tagName, properties, children });
const span = (classNames: string[], children: HastNode[] = []) =>
  element("span", { className: classNames }, children);

function rarityKind(rarity: string) {
  if (rarity === "unique") return "unique";
  if (rarity === "relic") return "relic";
  if (rarity === "magic") return "magic";
  return "rare";
}

function countRunes(runes: string[]) {
  const counts = new Map<string, number>();
  for (const rune of runes) counts.set(rune, (counts.get(rune) ?? 0) + 1);
  return [...counts].map(([rune, count]) => (count > 1 ? `${rune} ×${count}` : rune)).join(", ");
}

function formatProperty([name, value]: [string, string]) {
  return name === "Quality" ? `+${value}%` : value;
}

function makeItemTooltip(item: BuildItem, tooltipId: string): HastNode {
  const kind = rarityKind(item.rarity);
  const line = (value: string, variant?: string) =>
    span(["gameTooltipLine", ...(variant ? [`gameTooltipLine-${variant}`] : [])], [text(value)]);

  const groups: HastNode[][] = [];
  if (item.properties.length > 0) {
    groups.push(
      item.properties.map((property) =>
        span(["gameTooltipProperty"], [
          text(`${property[0]}: `),
          span(["gameTooltipValue"], [text(formatProperty(property))]),
        ]),
      ),
    );
  }

  const innate = [
    ...item.enchants.map((value) => line(value, "enchant")),
    ...item.runeMods.map((value) => line(value, "rune")),
    ...item.implicits.map((value) => line(value, "implicit")),
  ];
  if (innate.length > 0) groups.push(innate);

  const explicit = item.explicits.map((mod) => line(mod.text, mod.kind));
  if (explicit.length > 0) groups.push(explicit);

  const footer: HastNode[] = [];
  if (item.runes.length > 0) {
    footer.push(span(["gameTooltipSockets"], [text(`Socketed: ${countRunes(item.runes)}`)]));
  }
  if (item.corrupted) footer.push(line("Corrupted", "corrupted"));
  if (footer.length > 0) groups.push(footer);

  const body: HastNode[] = [];
  groups.forEach((group, index) => {
    if (index > 0) body.push(span(["gameTooltipSeparator"]));
    body.push(span(["gameTooltipDescription"], group));
  });
  body.push(span(["gameTooltipSeparator"]), span(["gameTooltipSource"], [text("Build data · poe.ninja")]));

  const header = [span(["gameTooltipName"], [text(item.name)])];
  if (item.base !== item.name) header.push(span(["gameTooltipBase"], [text(item.base)]));

  return element(
    "span",
    {
      id: tooltipId,
      className: ["gameTooltip", "gameTooltip-item", `gameTooltip-${kind}`],
      role: "tooltip",
    },
    [span(["gameTooltipHeader"], header), span(["gameTooltipBody"], body)],
  );
}

function makeSlot(
  item: BuildItem | undefined,
  key: string,
  side: CardSide,
  tooltipId: string,
): HastNode {
  const sideClasses = [
    side.x === "start" ? "buildSlotStart" : "buildSlotEnd",
    side.y === "top" ? "buildSlotTop" : "buildSlotBottom",
  ];
  if (!item) {
    return span(["buildSlot", `buildSlot-${key}`, "buildSlotEmpty"]);
  }
  const kind = rarityKind(item.rarity);
  return element(
    "span",
    {
      className: ["buildSlot", `buildSlot-${key}`, ...sideClasses, "gameTerm", `gameTerm-${kind}`],
      tabIndex: 0,
      ariaLabel: `${item.name}, ${item.base}`,
      ariaDescribedBy: tooltipId,
    },
    [
      ...(item.icon ? [element("img", { src: item.icon, alt: "", loading: "lazy", className: ["buildSlotIcon"] })] : []),
      makeItemTooltip(item, tooltipId),
    ],
  );
}

export function makeBuildGear(slug: string, idPrefix: string): HastNode {
  const build = loadBuild(slug);
  let nextId = 0;
  const tooltipId = () => `${idPrefix}-build-item-${++nextId}`;
  const bySlot = new Map(build.slots.map((entry) => [entry.slot, entry.item]));

  const grid = Object.entries(slotLayout)
    // Flask 2 only shows when the build uses it.
    .filter(([slot]) => slot !== "Flask 2" || bySlot.has(slot))
    .map(([slot, { key, x, y }]) => makeSlot(bySlot.get(slot), key, { x, y }, tooltipId()));

  const jewels = build.jewels.map((entry, index, all) =>
    makeSlot(
      entry.item,
      "jewel",
      { x: index < all.length / 2 ? "start" : "end", y: "bottom" },
      tooltipId(),
    ),
  );

  const { character } = build;
  const header = [
    span(["buildGearTitle"], [text(build.title ?? "Equipment")]),
    span(["buildGearMeta"], [text(`Level ${character.level} ${character.ascendancy}`)]),
  ];
  if (build.source) {
    header.push(
      element("a", { href: build.source, className: ["buildGearSource"], target: "_blank", rel: ["noopener", "noreferrer"] }, [
        text("View on poe.ninja"),
      ]),
    );
  }

  return element("div", { className: ["buildGear"] }, [
    element("div", { className: ["buildGearHeader"] }, header),
    element("div", { className: ["buildGearGrid"] }, grid),
    ...(jewels.length > 0
      ? [
          element("div", { className: ["buildGearJewels"] }, [
            span(["buildGearJewelsLabel"], [text("Jewels")]),
            span(["buildGearJewelList"], jewels),
          ]),
        ]
      : []),
  ]);
}
