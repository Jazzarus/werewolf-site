import type { Metadata } from "next";
import Image from "next/image";
import { Fragment } from "react";
import { formatTier, getGuideBySlug, getGuideSlugs, getSectionId } from "@/lib/guides";
import styles from "../werewolf.module.css";

type WerewolfGuidePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getGuideSlugs().map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: WerewolfGuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);

  return {
    title: guide.title,
    description: `${guide.title} Werewolf guide for the ${guide.class} class in Path of Exile 2.`,
  };
}

export default async function WerewolfGuidePage({
  params,
}: WerewolfGuidePageProps) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);

  return (
    <main className={`${styles.container} ${styles.guideContent}`}>
      <header className={styles.guideHeader}>
        <div className={styles.guidePortrait}>
          <Image src={guide.image} alt="" fill sizes="84px" preload />
          <span className={styles.imageFrame} aria-hidden="true" />
        </div>
        <h1>{guide.title}</h1>
        <p className={styles.guideByline}>
          <span>{guide.class}</span>
          <span className={styles.tierBadge} data-tier={guide.tier}>
            {formatTier(guide.tier)}
          </span>
        </p>
      </header>
      {guide.sections.map((section, index) => {
        // A guide can open with a contents list; it sits above the first heading.
        const contents =
          index === 0
            ? section.contentHtml.match(/^\s*<nav class="tableOfContents"[\s\S]*?<\/nav>/)?.[0]
            : undefined;
        const contentHtml = contents
          ? section.contentHtml.replace(contents, "")
          : section.contentHtml;

        return (
          <Fragment key={section.title}>
            {contents && <div dangerouslySetInnerHTML={{ __html: contents }} />}
            <section>
              <h2 id={getSectionId(section.title)}>{section.title}</h2>
              <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
            </section>
          </Fragment>
        );
      })}
    </main>
  );
}
