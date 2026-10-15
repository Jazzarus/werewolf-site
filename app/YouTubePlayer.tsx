"use client";

import { usePathname } from "next/navigation";
import styles from "./layout.module.css";

const pageVideos: Record<string, { id: string; title: string }> = {
  "/werewolf/amazon": {
    id: "Q2xkRetZB6k",
    title: "Amazon Werewolf guide video",
  },
  "/werewolf/gemling-legionnaire": {
    id: "GM2jWHo7kOY",
    title: "Gemling Legionnaire Werewolf guide video",
  },
  "/werewolf/shaman": {
    id: "u4uEKqXzATU",
    title: "Shaman Werewolf guide video",
  },
};

export function YouTubePlayer() {
  const pathname = usePathname();
  const pagePath = pathname.replace(/\/+$/, "") || "/";
  const video = pageVideos[pagePath];

  if (!video) {
    return (
      <div className={`${styles.mediaPlaceholder} ${styles.youtubePlaceholder}`}>
        A video for this page is coming soon
      </div>
    );
  }

  return (
    <>
      <iframe
        className={styles.youtubePlayer}
        src={`https://www.youtube-nocookie.com/embed/${video.id}`}
        title={video.title}
        width="400"
        height="300"
        allow="encrypted-media; picture-in-picture; web-share"
        allowFullScreen
      />
      <a
        className={styles.youtubeFallback}
        href={`https://www.youtube.com/watch?v=${video.id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Watch this video on YouTube
      </a>
    </>
  );
}
