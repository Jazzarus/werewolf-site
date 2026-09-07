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
        <h1>Tier List Explanation</h1>
        <p>
          Ranking explanations will be added here as each guide receives a
          finalized tier placement.
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
      <h2 id={`${group.name}-tier`}>{group.name} Tier</h2>
      <div className={styles.guideGrid}>
        {group.guides.map((guide) => (
          <GuideCard guide={guide} key={guide.slug} />
        ))}
      </div>
    </section>
  ));
}
