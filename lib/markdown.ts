import fs from "node:fs";
import path from "node:path";
import { defaultSchema, type Schema } from "hast-util-sanitize";
import { remark } from "remark";
import html from "remark-html";

type TooltipRecord = {
  name: string;
  type: string;
  description: string;
  image?: string;
  source: string;
};

type MarkdownNode = {
  type?: string;
  depth?: number;
  value?: string;
  url?: string;
  data?: {
    /** Set on gem names inside setup cards: render the gem's icon too. */
    gameIcon?: "skill" | "support";
    hName?: string;
    hProperties?: Record<string, unknown>;
    hChildren?: HastNode[];
  };
  children?: MarkdownNode[];
};

type HastNode = {
  type: "text" | "element";
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const tooltipDataPath = path.join(
  process.cwd(),
  "data",
  "game-tooltips.json",
);
let tooltipIndexCache: Map<string, TooltipRecord> | undefined;
let tooltipIndexModifiedAt = 0;

function normalizeEntityName(value: string) {
  return value
    .trim()
    .replace(/[’‘]/g, "'")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Gem names resolve to their Tier I entry first: "Biting Frost", "Biting
 * Frost II" and "Biting Frost III" all show "Biting Frost I", even when a
 * passive or item shares the bare name. Names without a Tier I entry fall
 * back to the exact name, then to an item whose name starts with it.
 */
function getTooltipEntity(name: string, entities: Map<string, TooltipRecord>) {
  const normalizedName = normalizeEntityName(name);
  const tieredName = normalizedName.match(/^(.*)\s+(i|ii|iii)$/i);
  const baseName = tieredName ? tieredName[1] : normalizedName;
  const tierOneName = `${baseName} i`;
  const itemPrefixMatch =
    normalizedName.split(" ").length > 1
      ? [...entities.values()].find(
          (entity) =>
            /unique item|charm|talisman base|\bitem\b/i.test(entity.type) &&
            normalizeEntityName(entity.name).startsWith(`${normalizedName} `),
        )
      : undefined;

  return (
    entities.get(tierOneName) ??
    entities.get(normalizedName) ??
    entities.get(baseName) ??
    itemPrefixMatch
  );
}

function getTooltipIndex(): Map<string, TooltipRecord> {
  if (!fs.existsSync(tooltipDataPath)) return new Map();
  // Reload when the catalog changes so `npm run dev` picks up new gems
  // without a restart.
  const modifiedAt = fs.statSync(tooltipDataPath).mtimeMs;
  if (tooltipIndexCache && modifiedAt === tooltipIndexModifiedAt) {
    return tooltipIndexCache;
  }
  tooltipIndexModifiedAt = modifiedAt;

  const data = JSON.parse(fs.readFileSync(tooltipDataPath, "utf8")) as {
    entities?: TooltipRecord[];
  };

  tooltipIndexCache = new Map(
    (data.entities ?? []).map((entity) => [
      normalizeEntityName(entity.name),
      entity,
    ]),
  );
  return tooltipIndexCache;
}

function getText(node: MarkdownNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(getText).join("");
}

function makeHastElement(
  tagName: string,
  properties: Record<string, unknown>,
  children: HastNode[] = [],
): HastNode {
  return { type: "element", tagName, properties, children };
}

function externalLinksOpenInNewTabs() {
  return (tree: MarkdownNode) => {
    function addLinkAttributes(node: MarkdownNode) {
      if (node.type === "link" && /^https?:\/\//i.test(node.url ?? "")) {
        node.data ??= {};
        node.data.hProperties = {
          ...node.data.hProperties,
          target: "_blank",
          rel: ["noopener", "noreferrer"],
        };
      }

      node.children?.forEach(addLinkAttributes);
    }

    addLinkAttributes(tree);
  };
}

type GameTermKind =
  | "gem"
  | "unique"
  | "passive"
  | "keystone"
  | "ascendancy"
  | "item"
  | "mechanic";

const GAME_TERM_KINDS: GameTermKind[] = [
  "gem",
  "unique",
  "passive",
  "keystone",
  "ascendancy",
  "item",
  "mechanic",
];

/** Maps a catalog type ("Support gem", "Unique item", ...) to a visual style. */
function getGameTermKind(type: string): GameTermKind {
  if (/\bgem\b/i.test(type)) return "gem";
  if (/^unique/i.test(type)) return "unique";
  if (/keystone/i.test(type)) return "keystone";
  if (/ascendancy/i.test(type)) return "ascendancy";
  if (/passive/i.test(type)) return "passive";
  if (/mechanic|modifier/i.test(type)) return "mechanic";
  return "item";
}

/**
 * PoE2DB descriptions sometimes run separate stat lines together
 * ("…exceed 100%Gain additional…"). Split those back into lines.
 */
function getDescriptionLines(description: string) {
  return description
    .split(/\r?\n/)
    .flatMap((line) => line.split(/(?<=[a-z%\d)\]])(?=[A-Z][a-z])/))
    .map((line) => line.trim())
    .filter((line) => line !== "" && !/\[\d+\]$/.test(line));
}

/** Short names authors use in rotations, e.g. "Pounce > CS > Shred". */
const rotationAliases = new Map([
  ["cs", "cross slash"],
  ["la", "lunar assault"],
  ["ah", "arctic howl"],
  ["lb", "lunar blessing"],
]);

const rotationSeparator = /\s*(?:>|→|->)\s*/;

function makeTooltip(entity: TooltipRecord, tooltipId: string): HastNode {
  const kind = getGameTermKind(entity.type);
  const text = (value: string): HastNode => ({ type: "text", value });
  const span = (className: string, children: HastNode[] = []) =>
    makeHastElement("span", { className: [className] }, children);

  const body: HastNode[] = [];
  if (entity.image) {
    body.push(
      span("gameTooltipIcon", [
        makeHastElement("img", {
          src: entity.image,
          alt: "",
          width: 64,
          height: 64,
          loading: "lazy",
        }),
      ]),
    );
  }
  body.push(
    span("gameTooltipType", [text(entity.type)]),
    span("gameTooltipSeparator"),
    span(
      "gameTooltipDescription",
      getDescriptionLines(entity.description).map((line) =>
        span("gameTooltipLine", [text(line)]),
      ),
    ),
    span("gameTooltipSeparator"),
    span("gameTooltipSource", [text("PoE2DB · CC BY-NC-SA 3.0")]),
  );

  return makeHastElement(
    "span",
    {
      id: tooltipId,
      className: ["gameTooltip", `gameTooltip-${kind}`],
      role: "tooltip",
    },
    [
      span("gameTooltipHeader", [span("gameTooltipName", [text(entity.name)])]),
      span("gameTooltipBody", body),
    ],
  );
}

function makeTermProperties(entity: TooltipRecord, tooltipId: string) {
  return {
    className: ["gameTerm", `gameTerm-${getGameTermKind(entity.type)}`],
    tabIndex: 0,
    ariaDescribedBy: tooltipId,
  };
}

function gameEntityTooltips(idPrefix: string) {
  const entities = getTooltipIndex();
  let nextId = 0;

  function resolveRotationStep(label: string) {
    const alias = rotationAliases.get(label.trim().toLowerCase());
    return getTooltipEntity(alias ?? label, entities);
  }

  /** "**Pounce** > CS > **Shred**" becomes an ordered skill bar. */
  function toSkillRotation(node: MarkdownNode) {
    if (node.type !== "paragraph") return false;
    const labels = getText(node).trim().split(rotationSeparator);
    if (labels.length < 3 || labels.some((label) => !label || label.length > 40)) {
      return false;
    }

    const steps = labels.map((label) => ({ label, entity: resolveRotationStep(label) }));
    if (steps.some((step) => !step.entity)) return false;

    node.data ??= {};
    node.data.hName = "ol";
    node.data.hProperties = { className: ["skillRotation"] };
    node.data.hChildren = steps.map(({ entity }) => {
      const resolved = entity as TooltipRecord;
      const tooltipId = `${idPrefix}-game-tooltip-${++nextId}`;
      const icon: HastNode[] = resolved.image
        ? [
            makeHastElement("img", {
              src: resolved.image,
              alt: "",
              width: 64,
              height: 64,
              loading: "lazy",
            }),
          ]
        : [];

      return makeHastElement("li", { className: ["skillRotationStep"] }, [
        makeHastElement("span", makeTermProperties(resolved, tooltipId), [
          makeHastElement("span", { className: ["skillRotationIcon"] }, icon),
          makeHastElement("span", { className: ["skillRotationName"] }, [
            { type: "text", value: resolved.name },
          ]),
          makeTooltip(resolved, tooltipId),
        ]),
      ]);
    });
    return true;
  }

  return (tree: MarkdownNode) => {
    function addTooltips(node: MarkdownNode, insideLink = false) {
      if (!insideLink && toSkillRotation(node)) return;

      if (node.type === "strong" && !insideLink) {
        const name = getText(node);
        const iconKind = node.data?.gameIcon;
        const found = getTooltipEntity(name, entities);
        // Setup cards only list gems: never show a passive or item that merely
        // shares the name (e.g. the Cold Penetration passive node).
        const entity = found && iconKind && !/\bgem\b/i.test(found.type) ? undefined : found;

        if (entity) {
          const tooltipId = `${idPrefix}-game-tooltip-${++nextId}`;
          node.data ??= {};
          node.data.hName = "span";
          node.data.hProperties = makeTermProperties(entity, tooltipId);
          node.data.hChildren = [
            ...(iconKind ? [makeGemIcon(iconKind, entity.image)] : []),
            makeHastElement("strong", {}, [{ type: "text", value: name }]),
            makeTooltip(entity, tooltipId),
          ];
          return;
        }
        if (iconKind) {
          // Not in the catalog yet: keep the row aligned with an empty socket.
          node.data ??= {};
          node.data.hName = "span";
          node.data.hProperties = { className: ["gemUnmatched"] };
          node.data.hChildren = [
            makeGemIcon(iconKind),
            makeHastElement("strong", {}, [{ type: "text", value: name }]),
          ];
          return;
        }
      }

      const nestedInLink = insideLink || node.type === "link";
      node.children?.forEach((child) => addTooltips(child, nestedInLink));
    }

    addTooltips(tree);
  };
}


/** The sanitizer prefixes every id with this to avoid clobbering page globals. */
const ID_PREFIX = "user-content-";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const explicitAnchor = /\s*\{#([a-z0-9-]+)\}\s*$/i;

function getInPageTarget(node: MarkdownNode) {
  return node.type === "link" && node.url?.startsWith("#") ? node.url.slice(1) : null;
}

/** "/werewolf-general/#setup-shred" style links to anchors on other site pages. */
function prefixSitePageAnchor(node: MarkdownNode) {
  if (node.type !== "link" || !node.url?.startsWith("/")) return;
  const hashIndex = node.url.indexOf("#");
  if (hashIndex === -1) return;
  const target = node.url.slice(hashIndex + 1);
  if (target && !target.startsWith(ID_PREFIX)) {
    node.url = `${node.url.slice(0, hashIndex)}#${ID_PREFIX}${target}`;
  }
}

function getOnlyLink(item: MarkdownNode) {
  const [paragraph, ...rest] = item.children ?? [];
  if (rest.length > 0 || paragraph?.type !== "paragraph") return null;
  const [link, ...extra] = paragraph.children ?? [];
  return extra.length === 0 && link && getInPageTarget(link) ? link : null;
}

/**
 * Gives h2/h3 headings ids (from the text, or an explicit "{#id}" suffix),
 * points "#id" links at the prefixed ids, and renders a list made only of
 * in-page links as the guide's contents box.
 */
function headingAnchors() {
  return (tree: MarkdownNode) => {
    const usedIds = new Set<string>();

    function visit(node: MarkdownNode) {
      if (node.type === "heading" && (node.depth === 2 || node.depth === 3)) {
        const last = node.children?.at(-1);
        let id = "";
        if (last?.type === "text" && last.value && explicitAnchor.test(last.value)) {
          id = last.value.match(explicitAnchor)?.[1] ?? "";
          last.value = last.value.replace(explicitAnchor, "");
        }
        id ||= slugify(getText(node)) || "section";
        let uniqueId = id;
        for (let index = 2; usedIds.has(uniqueId); index++) uniqueId = `${id}-${index}`;
        usedIds.add(uniqueId);
        node.data ??= {};
        node.data.hProperties = { ...node.data.hProperties, id: uniqueId };
      }

      if (
        node.type === "list" &&
        node.children?.length &&
        node.children.every((item) => getOnlyLink(item))
      ) {
        const links = (node.children ?? []).map((item) => getOnlyLink(item) as MarkdownNode);
        node.data ??= {};
        node.data.hName = "nav";
        node.data.hProperties = {
          className: ["tableOfContents"],
          ariaLabel: "Guide contents",
        };
        node.data.hChildren = [
          makeHastElement("span", { className: ["tableOfContentsTitle"] }, [
            { type: "text", value: "Contents" },
          ]),
          makeHastElement(
            "ol",
            {},
            links.map((link) =>
              makeHastElement("li", {}, [
                makeHastElement(
                  "a",
                  { href: `#${ID_PREFIX}${getInPageTarget(link)}` },
                  [{ type: "text", value: getText(link) }],
                ),
              ]),
            ),
          ),
        ];
        return;
      }

      const target = getInPageTarget(node);
      if (target && !target.startsWith(ID_PREFIX)) node.url = `#${ID_PREFIX}${target}`;
      prefixSitePageAnchor(node);

      node.children?.forEach(visit);
    }

    visit(tree);
  };
}


/* ---------------------------------------------------------------------------
 * Gem setup cards. A list like
 *
 *   - **Lunar Assault** {#setup-lunar-assault}
 *     - **Ice Bite II**
 *     - Without lineage supports
 *       - **Cold Penetration**
 *
 * renders as a card per skill: the skill with its icon, then its support
 * gems, and optional labelled groups for variants of the setup.
 * ------------------------------------------------------------------------- */
function getOnlyStrong(node: MarkdownNode | undefined) {
  if (node?.type !== "paragraph" || node.children?.length !== 1) return null;
  const [child] = node.children;
  return child.type === "strong" ? child : null;
}

function isSupportItem(item: MarkdownNode) {
  return item.children?.length === 1 && Boolean(getOnlyStrong(item.children[0]));
}

function isVariantItem(item: MarkdownNode) {
  const [label, list, ...rest] = item.children ?? [];
  return (
    rest.length === 0 &&
    label?.type === "paragraph" &&
    list?.type === "list" &&
    Boolean(list.children?.length) &&
    (list.children ?? []).every(isSupportItem)
  );
}

function isSetupItem(item: MarkdownNode) {
  const [header, list, ...rest] = item.children ?? [];
  return (
    rest.length === 0 &&
    header?.type === "paragraph" &&
    header.children?.[0]?.type === "strong" &&
    list?.type === "list" &&
    Boolean(list.children?.length) &&
    (list.children ?? []).every((child) => isSupportItem(child) || isVariantItem(child))
  );
}

function setClass(
  node: MarkdownNode,
  className: string,
  extra: Record<string, unknown> = {},
  tagName?: string,
) {
  node.data ??= {};
  // Tight lists unwrap <p>, so paragraph-level wrappers render as <div>.
  if (tagName) node.data.hName = tagName;
  node.data.hProperties = { ...node.data.hProperties, className: [className], ...extra };
}

function markSupportList(list: MarkdownNode) {
  setClass(list, "gemSetupSupports");
  for (const item of list.children ?? []) {
    setClass(item, "gemSetupSupport");
    const strong = getOnlyStrong(item.children?.[0]) as MarkdownNode;
    strong.data = { ...strong.data, gameIcon: "support" };
  }
}

function gemSetups() {
  return (tree: MarkdownNode) => {
    function visit(node: MarkdownNode) {
      if (node.type === "list" && node.children?.length && node.children.every(isSetupItem)) {
        setClass(node, "gemSetups");
        for (const item of node.children) {
          const [header, list] = item.children as [MarkdownNode, MarkdownNode];
          const headerChildren = header.children ?? [];
          const last = headerChildren.at(-1);
          let id: string | undefined;
          if (last?.type === "text" && last.value && explicitAnchor.test(last.value)) {
            id = last.value.match(explicitAnchor)?.[1];
            last.value = last.value.replace(explicitAnchor, "");
          }
          setClass(item, "gemSetup", id ? { id } : {});
          setClass(header, "gemSetupSkill", {}, "div");
          const [skill] = headerChildren;
          skill.data = { ...skill.data, gameIcon: "skill" };

          const groups: MarkdownNode[] = [];
          let shared: MarkdownNode | null = null;
          for (const child of list.children ?? []) {
            if (isSupportItem(child)) {
              if (!shared) {
                shared = { type: "list", children: [] };
                groups.push(shared);
              }
              shared.children?.push(child);
            } else {
              shared = null;
              const [label, variantList] = child.children as [MarkdownNode, MarkdownNode];
              setClass(child, "gemSetupVariant");
              setClass(label, "gemSetupVariantLabel", {}, "div");
              markSupportList(variantList);
              groups.push(child);
            }
          }
          for (const group of groups) if (group.type === "list") markSupportList(group);

          // Supports first, then the labelled variants, all inside one list.
          const supportLists = groups.filter((group) => group.type === "list");
          const variants = groups.filter((group) => group.type !== "list");
          const body: MarkdownNode = { type: "list", children: [] };
          setClass(body, "gemSetupBody");
          for (const supportList of supportLists) {
            body.children?.push({
              type: "listItem",
              data: { hProperties: { className: ["gemSetupGroup"] } },
              children: [supportList],
            });
          }
          body.children?.push(...variants);
          item.children = [header, body];
        }
        return;
      }
      node.children?.forEach(visit);
    }

    visit(tree);
  };
}

function makeGemIcon(kind: "skill" | "support", image?: string): HastNode {
  return makeHastElement(
    "span",
    { className: ["gemIcon", kind === "skill" ? "gemIconSkill" : "gemIconSupport"] },
    image
      ? [makeHastElement("img", { src: image, alt: "", width: 64, height: 64, loading: "lazy" })]
      : [],
  );
}

const buildLinkPattern = /poe\.ninja\/[^\s]*pob|pobb\.in|pathofbuilding/i;

function isBuildLinkItem(item: MarkdownNode) {
  const [paragraph, ...rest] = item.children ?? [];
  if (rest.length > 0 || paragraph?.type !== "paragraph") return false;
  const [content, ...extra] = paragraph.children ?? [];
  if (extra.length > 0 || !content) return false;
  const link =
    content.type === "strong" && content.children?.length === 1
      ? content.children[0]
      : content;
  return link.type === "link" && buildLinkPattern.test(link.url ?? "");
}

/** A list made only of Path of Building links renders as game buttons. */
function buildLinkButtons() {
  return (tree: MarkdownNode) => {
    function visit(node: MarkdownNode) {
      if (
        node.type === "list" &&
        node.children?.length &&
        node.children.every(isBuildLinkItem)
      ) {
        node.data ??= {};
        node.data.hProperties = {
          ...node.data.hProperties,
          className: ["buildLinks"],
        };
        return;
      }
      node.children?.forEach(visit);
    }

    visit(tree);
  };
}

const gameClassNames = [
  "gameTerm",
  "gameTooltip",
  "gameTooltipHeader",
  "gameTooltipName",
  "gameTooltipBody",
  "gameTooltipIcon",
  "gameTooltipType",
  "gameTooltipSeparator",
  "gameTooltipDescription",
  "gameTooltipLine",
  "gameTooltipSource",
  "skillRotationIcon",
  "skillRotationName",
  "tableOfContentsTitle",
  "gemIcon",
  "gemIconSkill",
  "gemIconSupport",
  "gemUnmatched",
  ...GAME_TERM_KINDS.flatMap((kind) => [`gameTerm-${kind}`, `gameTooltip-${kind}`]),
];

type AttributeDefinitions = NonNullable<Schema["attributes"]>[string];

/**
 * hast-util-sanitize uses the first matching definition for a property, so
 * extra class names are merged into the tag's existing className rule.
 */
function withClassNames(tagName: string, classNames: string[]) {
  const definitions: AttributeDefinitions =
    defaultSchema.attributes?.[tagName] ?? [];
  const existing = definitions.flatMap((definition) =>
    Array.isArray(definition) && definition[0] === "className"
      ? definition.slice(1)
      : [],
  );
  const others = definitions.filter(
    (definition) =>
      !(Array.isArray(definition) && definition[0] === "className"),
  );
  const classNameRule: [string, ...typeof existing] = [
    "className",
    ...existing,
    ...classNames,
  ];
  return [...others, classNameRule];
}

const articleHtmlSchema: Schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "nav"],
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      ["target", "_blank"],
      "rel",
    ],
    span: [
      ...withClassNames("span", gameClassNames),
      "id",
      "tabIndex",
      "ariaDescribedBy",
      ["role", "tooltip"],
    ],
    nav: [["className", "tableOfContents"], "ariaLabel"],
    ol: withClassNames("ol", ["skillRotation"]),
    ul: withClassNames("ul", ["buildLinks", "gemSetups", "gemSetupBody", "gemSetupSupports"]),
    li: withClassNames("li", [
      "skillRotationStep",
      "gemSetup",
      "gemSetupGroup",
      "gemSetupVariant",
      "gemSetupSupport",
    ]),
    div: withClassNames("div", ["gemSetupSkill", "gemSetupVariantLabel"]),
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      ["width", 64],
      ["height", 64],
      ["loading", "lazy"],
    ],
  },
};

export async function renderArticleMarkdown(
  markdown: string,
  idPrefix: string,
): Promise<string> {
  const result = await remark()
    .use(externalLinksOpenInNewTabs)
    .use(headingAnchors)
    .use(buildLinkButtons)
    .use(gemSetups)
    .use(() => gameEntityTooltips(idPrefix))
    .use(html, { sanitize: articleHtmlSchema })
    .process(markdown);

  return result.toString();
}
