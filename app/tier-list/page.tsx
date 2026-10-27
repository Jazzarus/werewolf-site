import Image from "next/image";
import Link from "next/link";
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

      <section className={styles.container} aria-labelledby="class-tier-list">
        <h2 id="class-tier-list">Class Tier List</h2>
        <ClassTierSections />
        <h3>About the Class Tier List</h3>
        <p>
          This tier list ranks each class by <strong>how good its ascendancies
          are for Werewolf builds</strong>. A class ranks high when its
          ascendancies as a group are strong, not because one of them is
          great and the others are weak.
        </p>
        <p>
          It is made for two kinds of players. The first want to be able to
          change ascendancies easily inside the same class. The second are
          not sure which ascendancy they want yet, but want a good start.
          Picking a high ranked class from the beginning maximizes your
          chances: whichever ascendancy you end up choosing, it is likely to
          be a good one, and the others stay available if you change your
          mind.
        </p>
        <p>
          If you already know the ascendancy you want to play, use the tier
          list above instead. Classes whose ascendancies are not ranked yet
          are left out.
        </p>
      </section>

      {/* Ascendancies without a tier yet sit at the very bottom, out of the way. */}
      <section className={styles.container} aria-label="Unranked ascendancies">
        <TierSections unranked />
      </section>
    </main>
  );
}

async function TierSections({ unranked = false }: { unranked?: boolean }) {
  const guides = await getAllGuides();
  const guideGroups = groupGuidesByMetadata(
    guides,
    "tier",
    GUIDE_TIER_ORDER,
  );

  return guideGroups
    .filter((group) => (group.name === "Unranked") === unranked)
    .map((group) => {
    const isRanked = group.name !== "Unranked";

    return (
      <section
        className={styles.tierRow}
        data-tier={group.name}
        key={group.name}
        aria-labelledby={`${group.name}-tier`}
      >
        <h2 className={styles.tierHeading} id={`${group.name}-tier`}>
          {isRanked ? (
            <>
              <span className={styles.tierPennant} aria-hidden="true">
                {group.name}
              </span>
              <span className={styles.tierHeadingText}>
                {group.name} Tier
              </span>
            </>
          ) : (
            group.name
          )}
        </h2>
        <div className={styles.guideGrid}>
          {group.guides.map((guide) => (
            <GuideCard guide={guide} key={guide.slug} />
          ))}
        </div>
      </section>
    );
  });
}

/** Class tiers, based on how good each class's ascendancies are. */
const CLASS_TIERS = [
  { tier: "S", classes: ["Druid"] },
  { tier: "A", classes: ["Huntress", "Mercenary"] },
  { tier: "B", classes: ["Sorceress"] },
  { tier: "C", classes: ["Ranger"] },
];

async function ClassTierSections() {
  const guides = await getAllGuides();

  return CLASS_TIERS.map(({ tier, classes }) => (
    <section
      className={styles.tierRow}
      data-tier={tier}
      key={tier}
      aria-labelledby={`${tier}-class-tier`}
    >
      <h3 className={styles.tierHeading} id={`${tier}-class-tier`}>
        <span className={styles.tierPennant} aria-hidden="true">
          {tier}
        </span>
        <span className={styles.tierHeadingText}>{tier} Tier</span>
      </h3>
      <div className={styles.guideGrid}>
        {classes.map((name) => {
          const ascendancies = guides
            .filter((guide) => guide.class === name && !guide.isPlaceholder)
            .map((guide) => guide.title);

          return (
            <Link
              className={`${styles.guideCard} ${styles.guideCardTier}`}
              href={`/werewolf#${name}-guides`}
              key={name}
            >
              <div className={styles.imageContainer}>
                <Image
                  src={`/images/classes/${name.toLowerCase()}.webp`}
                  alt=""
                  fill
                  sizes="72px"
                  className={styles.guideImage}
                />
                <span className={styles.imageFrame} aria-hidden="true" />
              </div>
              <div className={styles.guideText}>
                <h3>{name}</h3>
                <div
                  className={`${styles.guideMeta} ${styles.guideMetaList}`}
                >
                  {ascendancies.map((title) => (
                    <span key={title}>{title}</span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  ));
}
