import Image from "next/image";
import Link from "next/link";
import type { Guide } from "@/lib/guides";
import styles from "./werewolf.module.css";

type GuideCardProps = {
  guide: Guide;
  showTier?: boolean;
};

export function GuideCard({ guide, showTier = true }: GuideCardProps) {
  const classNames = [
    styles.guideCard,
    showTier ? styles.guideCardTier : styles.guideCardHome,
    guide.isPlaceholder ? styles.guideCardPlaceholder : "",
  ].filter(Boolean);

  return (
    <Link className={classNames.join(" ")} href={`/werewolf/${guide.slug}`}>
      <div className={styles.imageContainer}>
        <Image
          src={guide.image}
          alt=""
          fill
          sizes={showTier ? "72px" : "84px"}
          className={styles.guideImage}
        />
        <span className={styles.imageFrame} aria-hidden="true" />
      </div>
      <div className={styles.guideText}>
        <h3>{guide.title}</h3>
        {showTier && (
          // The tier list's pennants already name the tier, so cards show the class.
          <div className={styles.guideMeta}>
            <span>{guide.class}</span>
          </div>
        )}
        {guide.isPlaceholder && (
          <span className={styles.comingSoon}>Guide coming soon</span>
        )}
      </div>
    </Link>
  );
}
