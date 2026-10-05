import { getAllFarms, FARM_TIER_ORDER } from "@/lib/farms";
import styles from "./farms.module.css";

export default async function FarmsPage() {
  const farms = await getAllFarms();

  return (
    <main>
      <section aria-labelledby="farm-tier-list">
        <h1 id="farm-tier-list">Farm Strategy Tier List</h1>
        <p className={styles.intro}>
          Farming strategies ranked for Werewolf builds. This list is managed
          separately from the ascendancy guide tier list.
        </p>

        {farms.length === 0 ? (
          <p className={styles.emptyState}>
            No farm strategies have been ranked yet. Add a Farm Strategy in the
            TinaCMS editor to start the list.
          </p>
        ) : (
          <div className={styles.tierList}>
            {FARM_TIER_ORDER.map((tier) => {
              const tierFarms = farms.filter((farm) => farm.tier === tier);
              if (tierFarms.length === 0) return null;

              return (
                <section
                  className={styles.tierSection}
                  key={tier}
                  aria-labelledby={`farm-tier-${tier}`}
                >
                  <h2 id={`farm-tier-${tier}`}>{tier} Tier</h2>
                  <div className={styles.farmGrid}>
                    {tierFarms.map((farm) => (
                      <article className={styles.farmEntry} key={farm.slug}>
                        <h3>{farm.title}</h3>
                        <div
                          className={styles.strategy}
                          dangerouslySetInnerHTML={{
                            __html: farm.strategyHtml,
                          }}
                        />
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
