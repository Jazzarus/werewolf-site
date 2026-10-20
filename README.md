# Werewolf Guides

A statically exported Path of Exile 2 Werewolf guide site built with Next.js App Router, TypeScript, Markdown, and TinaCMS.

## Architecture

- `content/guides/*.md` is the source of truth for guide titles, card images, classes, tiers, and sections.
- `content/farms/*.md` is the separate source of truth for the farm strategy tier list at `/farms`.
- The Markdown filename is the canonical URL slug. For example, `amazon.md` is published at `/werewolf/amazon/`; do not add a separate `slug` field.
- `lib/guides.ts` validates and renders guide data during the build.
- `app/layout.tsx` owns the shared banner, navigation, content area, and sidebar.
- `app/werewolf/GuideCard.tsx` is shared by the class index and tier list.
- TinaCMS exposes farms as a separate Farm Strategies collection, so farm entries can be added, edited, and removed independently of guides.
- Next.js writes the deployable static site to `out/`.

The current guides intentionally contain placeholder copy while the site is being built.

## Local development

Install dependencies and start Next.js with the local TinaCMS editor:

```bash
npm install
npm run dev
```

The site is available at `http://localhost:3000`. TinaCMS generates its local admin interface under `public/admin/`; generated Tina and Next.js output is ignored by Git.

## Visual system

The site follows the Path of Exile 2 and Jazzarus game-wheel references: dark stone, restrained crimson, aged gold, carved metal frames, and generous reading space. Existing content and future guides share the same styling automatically.

- `app/globals.css` owns the palette, spacing, reading width, and font tokens. Fontin is the display face for headings and navigation; Georgia is used for readable body copy.
- `app/layout.module.css` styles the shared shell and semantic content inside each page's `<main>`, including headings, lists, quotes, tables, code, media, forms, and disclosures. New article pages should use these elements instead of adding independent typography or colors.
- `app/werewolf/werewolf.module.css` owns the shared guide cards and article bylines. Cards respond to the available content width, including the sidebar, using container queries. Both the guide index and tier list use `GuideCard`.
- Use only relevant supplied assets. Keep frame corners at a consistent size with border images, preserve artwork proportions, and avoid enlarging the small ascendancy portraits into hero images.
- Keep layouts fluid, let long titles wrap, constrain article line length, and allow wide tables/code to scroll within the article. Do not hide page overflow to conceal layout problems. Preserve keyboard focus, native menu behavior, touch targets, and reduced-motion support.
- After visual changes, check narrow phones, tablets, desktop widths on both sides of each breakpoint, and ultrawide screens. Verify the production export as CSS ordering can differ from development.

## Guide format

Each guide must provide all fields below. Card image paths are relative to `public/` and are checked during the build.

```yaml
---
title: Amazon
image: /images/ascendancies/amazon.png
class: Huntress
tier: B
sections:
  - title: Intro
    content: Coming soon.
---
```

Section content supports Markdown. Raw HTML is sanitized; interactive embeds should be implemented through a dedicated component or structured metadata rather than pasted HTML.

Bold text that exactly matches a Path of Exile 2 skill, passive, or item in the generated PoE2DB catalog gets a non-link tooltip with its short description and icon when available. Unmatched bold text remains ordinary bold text. The build syncs newly encountered names and their icons; `npm run sync:tooltips` refreshes the full local catalog. Tooltip source credits appear in the popup.

Support Gem variants resolve to their Tier I tooltip: an unnumbered name ("Biting Frost") uses Tier I ("Biting Frost I") whenever it exists, even if a passive or item has the bare name, and explicit Tier II or III names also use Tier I. Keep the article text unnumbered. The sync script looks up the Tier I page first for the same reason. Curated text in `descriptionOverrides` in `scripts/sync-game-tooltips.mjs` always replaces the PoE2DB summary (used for the Absent Amulet and Unset Ring).

Matched names are coloured by type, like in game (gems teal, uniques orange, passives gold), and the hover card uses the matching in-game header art from `public/assets`.

A paragraph made only of three or more skill names separated by `>` renders as a numbered skill bar, for example `**Pounce** > CS > **Lunar Assault** > **Shred**`. Every step must match a catalog entry; `CS`, `LA`, `AH`, and `LB` are accepted short forms. Any other paragraph containing `>` stays ordinary text.

Headings get link anchors automatically from their text, or from an explicit suffix such as `## Leveling as a Werewolf {#leveling}`. A list made only of in-page links (`- [Leveling](#leveling)`) renders as a numbered "Contents" box; the general guide uses one at the top.

A gem setup is a list whose items are a bold skill followed by its bold support gems; it renders as a card with icons and hover tooltips, and several setups sit side by side in up to three columns. A plain-text line with its own nested list labels a variant group, and the card shows shared supports first:

```md
- **Lunar Assault** {#setup-lunar-assault}
  - **Ice Bite II**
  - Without lineage supports
    - **Cold Penetration**
  - With lineage supports
    - **Rakiata's Flow**
```

Only gem entries are used inside setup cards, so a passive with the same name never appears there; a gem missing from the catalog shows as an empty socket until the next sync. Other pages can link straight to a card, for example `[Lunar Assault setup](/werewolf-general/#setup-lunar-assault)`.

A list whose items are only Path of Building links (poe.ninja `pob`, pobb.in) renders as gold buttons.

A guide whose sections all still say "Coming soon." or "This is a placeholder guide for …" is shown dimmed with "Guide coming soon" on its card. It switches back automatically once any section has real content.

The sidebar YouTube panel only appears on pages listed in `app/YouTubePlayer.tsx`; other pages lead with the Twitch stream.

## Farm strategy format

Create one Markdown document per strategy in `content/farms/`. TinaCMS manages these documents in its separate Farm Strategies collection. Each entry has a title, one of the S/A/B/C/D/F tiers, and a Markdown strategy field; its filename is the route-independent record ID and does not appear on the public tier list.

## Checks and production build

```bash
npm run lint
npx tsc --noEmit --incremental false
npm run build
```

The production build removes the local Tina admin and creates a static export in `out/`.

## Cloudflare Pages

The repository is connected to GitHub. Configure Cloudflare Pages with:

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `out`

The application uses trailing-slash URLs so routes are exported as directories containing `index.html`.
