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
  value?: string;
  url?: string;
  data?: {
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

function normalizeEntityName(value: string) {
  return value
    .trim()
    .replace(/[’‘]/g, "'")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getTooltipEntity(name: string, entities: Map<string, TooltipRecord>) {
  const normalizedName = normalizeEntityName(name);
  const numberedSupport = normalizedName.match(/^(.*)\s+(ii|iii)$/i);
  const tierOneName = numberedSupport
    ? `${numberedSupport[1]} i`
    : `${normalizedName} i`;
  const itemPrefixMatch =
    normalizedName.split(" ").length > 1
      ? [...entities.values()].find(
          (entity) =>
            /unique item|charm|talisman base|\bitem\b/i.test(entity.type) &&
            normalizeEntityName(entity.name).startsWith(`${normalizedName} `),
        )
      : undefined;

  return (
    (numberedSupport ? entities.get(tierOneName) : undefined) ??
    entities.get(normalizedName) ??
    entities.get(tierOneName) ??
    itemPrefixMatch
  );
}

function getTooltipIndex(): Map<string, TooltipRecord> {
  if (tooltipIndexCache) return tooltipIndexCache;
  if (!fs.existsSync(tooltipDataPath)) return new Map();

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

function gameEntityTooltips(idPrefix: string) {
  const entities = getTooltipIndex();
  let nextId = 0;

  return (tree: MarkdownNode) => {
    function addTooltips(node: MarkdownNode, insideLink = false) {
      if (node.type === "strong" && !insideLink) {
        const name = getText(node);
        const entity = getTooltipEntity(name, entities);

        if (entity) {
          const tooltipId = `${idPrefix}-game-tooltip-${++nextId}`;
          const tooltipContent: HastNode[] = [];

          if (entity.image) {
            tooltipContent.push(
              makeHastElement("img", {
                src: entity.image,
                alt: "",
                width: 64,
                height: 64,
                loading: "lazy",
              }),
            );
          }

          tooltipContent.push(
            makeHastElement(
              "span",
              { className: ["gameTooltipCopy"] },
              [
                makeHastElement(
                  "span",
                  { className: ["gameTooltipName"] },
                  [{ type: "text", value: entity.name }],
                ),
                makeHastElement(
                  "span",
                  { className: ["gameTooltipType"] },
                  [{ type: "text", value: entity.type }],
                ),
                makeHastElement(
                  "span",
                  { className: ["gameTooltipDescription"] },
                  [{ type: "text", value: entity.description }],
                ),
                makeHastElement(
                  "span",
                  { className: ["gameTooltipSource"] },
                  [{ type: "text", value: "PoE2DB · CC BY-NC-SA 3.0" }],
                ),
              ],
            ),
          );

          node.data ??= {};
          node.data.hName = "span";
          node.data.hProperties = {
            className: ["gameTerm"],
            tabIndex: 0,
            ariaDescribedBy: tooltipId,
          };
          node.data.hChildren = [
            makeHastElement("strong", {}, [
              { type: "text", value: name },
            ]),
            makeHastElement(
              "span",
              { id: tooltipId, className: ["gameTooltip"], role: "tooltip" },
              tooltipContent,
            ),
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

const articleHtmlSchema: Schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      ["target", "_blank"],
      "rel",
    ],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      [
        "className",
        "gameTerm",
        "gameTooltip",
        "gameTooltipCopy",
        "gameTooltipName",
        "gameTooltipType",
        "gameTooltipDescription",
        "gameTooltipSource",
      ],
      "id",
      "tabIndex",
      "ariaDescribedBy",
      ["role", "tooltip"],
    ],
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
    .use(() => gameEntityTooltips(idPrefix))
    .use(html, { sanitize: articleHtmlSchema })
    .process(markdown);

  return result.toString();
}
