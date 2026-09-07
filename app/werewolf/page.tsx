import { getAllGuides, groupGuidesByMetadata } from "@/lib/guides";
import { GuideCard } from "./GuideCard";
import styles from "./werewolf.module.css";

const classOrder = [
  "Huntress",
  "Mercenary",
  "Monk",
  "Sorceress",
  "Witch",
  "Warrior",
  "Druid",
  "Ranger",
  "Shadow",
  "Marauder",
  "Duelist",
  "Templar",
];

export default async function WerewolfPage() {
  const guides = await getAllGuides();
  const guideGroups = groupGuidesByMetadata(guides, "class", classOrder);

  return (
    <main>
      <section className={`${styles.container} ${styles.intro}`}>
        <p>
          Explore Werewolf guides for every ascendancy, with builds and
          gameplay information organized in one place.
        </p>
      </section>

      <section
        className={styles.container}
        aria-labelledby="ascendancy-guides"
      >
        <h1 id="ascendancy-guides">Ascendancy Guides</h1>

        {guideGroups.map((group) => (
          <section key={group.name} aria-labelledby={`${group.name}-guides`}>
            <h2 id={`${group.name}-guides`}>{group.name}</h2>
            <div className={styles.guideGrid}>
              {group.guides.map((guide) => (
                <GuideCard guide={guide} key={guide.slug} />
              ))}
            </div>
          </section>
        ))}
      </section>
    </main>
  );
}
