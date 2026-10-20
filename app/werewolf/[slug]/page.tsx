import type { Metadata } from "next";
import Image from "next/image";
import { formatTier, getGuideBySlug, getGuideSlugs } from "@/lib/guides";
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
      {guide.sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          <div dangerouslySetInnerHTML={{ __html: section.contentHtml }} />
        </section>
      ))}
    </main>
  );
}
