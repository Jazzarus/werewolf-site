import Image from "next/image";
import Link from "next/link";
import type { Guide } from "@/lib/guides";
import styles from "./werewolf.module.css";

type GuideCardProps = {
  guide: Guide;
};

export function GuideCard({ guide }: GuideCardProps) {
  return (
    <Link
      className={styles.guideCard}
      href={`/werewolf/${guide.slug}`}
    >
      <div className={styles.imageContainer}>
        <Image
          src={guide.image}
          alt=""
          fill
          sizes="72px"
          className={styles.guideImage}
        />
      </div>
      <h3>{guide.title}</h3>
      <div className={styles.guideMeta}>
        <span>{guide.class}</span>
        <span>Tier {guide.tier}</span>
      </div>
    </Link>
  );
}
