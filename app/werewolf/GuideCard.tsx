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
          sizes="(max-width: 767px) 50vw, (max-width: 1199px) 33vw, 20vw"
          className={styles.guideImage}
        />
      </div>
      <h3>{guide.title}</h3>
    </Link>
  );
}
