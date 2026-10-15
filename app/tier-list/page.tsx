import {
  getAllGuides,
  groupGuidesByMetadata,
  GUIDE_TIER_ORDER,
} from "@/lib/guides";
import { GuideCard } from "@/app/werewolf/GuideCard";
import styles from "@/app/werewolf/werewolf.module.css";

export default function TierList() {
  return (
    <main>
      <section className={styles.container} aria-labelledby="tier-list">
        <h1 id="tier-list">Tier List</h1>
        <TierSections />
      </section>

      <section className={styles.container}>
        <h2>About the Tier List</h2>
        <p>
          This tier list ranks how strong each ascendancy is specifically for
          Werewolf builds. <strong>Every build featured on this website can
          clear all content in the game</strong>, including those in the lower
          tiers. The rankings reflect differences in overall strength, not
          whether a build is good or bad.
        </p>
        <p>
          Each ascendancy is evaluated using a realistic, semi-budget to
          moderately invested build, based on the builds showcased in the
          guides. These aren&apos;t mirror-tier builds with unlimited currency.
          With further investment, the rankings could change, but this tier
          list gives you a consistent comparison using builds that regular
          players can realistically put together.
        </p>
      </section>
    </main>
  );
}

async function TierSections() {
  const guides = await getAllGuides();
  const guideGroups = groupGuidesByMetadata(
    guides,
    "tier",
    GUIDE_TIER_ORDER,
  );

  return guideGroups.map((group) => (
    <section key={group.name} aria-labelledby={`${group.name}-tier`}>
      <h2 id={`${group.name}-tier`}>
        {group.name === "Unranked" ? group.name : `${group.name} Tier`}
      </h2>
      <div className={styles.guideGrid}>
        {group.guides.map((guide) => (
          <GuideCard guide={guide} key={guide.slug} />
        ))}
      </div>
    </section>
  ));
}
