import type { Metadata } from "next";
import { getGuideBySlug, getGuideSlugs } from "@/lib/guides";
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
      <h1>{guide.title}</h1>
      {guide.sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          <div dangerouslySetInnerHTML={{ __html: section.contentHtml }} />
        </section>
      ))}
    </main>
  );
}
