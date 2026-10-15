import Image from "next/image";
import Link from "next/link";
import type { Guide } from "@/lib/guides";
import styles from "./werewolf.module.css";

type GuideCardProps = {
  guide: Guide;
  showTier?: boolean;
};

export function GuideCard({ guide, showTier = true }: GuideCardProps) {
  return (
    <Link
      className={`${styles.guideCard}${showTier ? "" : ` ${styles.guideCardHome}`}`}
      href={`/werewolf/${guide.slug}`}
    >
      <div className={styles.imageContainer}>
        <Image
          src={guide.image}
          alt=""
          fill
          sizes={showTier ? "72px" : "80px"}
          className={styles.guideImage}
        />
      </div>
      <div className={styles.guideText}>
        <h3>{guide.title}</h3>
        <div className={styles.guideMeta}>
          <span>{guide.class}</span>
          {showTier && <span>Tier {guide.tier}</span>}
        </div>
      </div>
    </Link>
  );
}
