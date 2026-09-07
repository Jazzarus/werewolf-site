# Werewolf Guides

A statically exported Path of Exile 2 Werewolf guide site built with Next.js App Router, TypeScript, Markdown, and TinaCMS.

## Architecture

- `content/guides/*.md` is the source of truth for guide titles, card images, classes, tiers, and sections.
- The Markdown filename is the canonical URL slug. For example, `amazon.md` is published at `/werewolf/amazon/`; do not add a separate `slug` field.
- `lib/guides.ts` validates and renders guide data during the build.
- `app/layout.tsx` owns the shared banner, navigation, content area, and sidebar.
- `app/werewolf/GuideCard.tsx` is shared by the class index and tier list.
- Next.js writes the deployable static site to `out/`.

The current guides intentionally contain placeholder copy while the site is being built.

## Local development

Install dependencies and start Next.js with the local TinaCMS editor:

```bash
npm install
npm run dev
```

The site is available at `http://localhost:3000`. TinaCMS generates its local admin interface under `public/admin/`; generated Tina and Next.js output is ignored by Git.

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
