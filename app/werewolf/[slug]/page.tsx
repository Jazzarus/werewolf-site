import { getGuideBySlug, getGuideSlugs } from "@/lib/guides";

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

export default async function WerewolfGuidePage({
  params,
}: WerewolfGuidePageProps) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);

  return (
    <main>
      <h1>{guide.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: guide.contentHtml }} />
    </main>
  );
}
