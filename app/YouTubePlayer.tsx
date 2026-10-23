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
  "/werewolf/oracle": {
    id: "Q45scQzBaxg",
    title: "Oracle Werewolf guide video",
  },
  "/werewolf/shaman": {
    id: "u4uEKqXzATU",
    title: "Shaman Werewolf guide video",
  },
  "/werewolf/stormweaver": {
    id: "Kanxx3ASkEs",
    title: "Stormweaver Werewolf guide video",
  },
  "/werewolf/chronomancer": {
    id: "gWpdr12L_kk",
    title: "Chronomancer Werewolf guide video",
  },
  "/werewolf/disciple-of-varashta": {
    id: "VxcGsKcGAuY",
    title: "Disciple of Varashta Werewolf guide video",
  },
  "/werewolf/spirit-walker": {
    id: "-Yi07MUTHNE",
    title: "Spirit Walker Werewolf guide video",
  },
  "/werewolf/ritualist": {
    id: "Rp1ydfNhvzA",
    title: "Ritualist Werewolf guide video",
  },
  "/werewolf/witchhunter": {
    id: "oPAvbXZZUNI",
    title: "Witchhunter Werewolf guide video",
  },
  "/werewolf/tactician": {
    id: "2FhyPUqV778",
    title: "Tactician Werewolf guide video",
  },
  "/werewolf/deadeye": {
    id: "TgbQresBtDo",
    title: "Deadeye Werewolf guide video",
  },
  "/werewolf/pathfinder": {
    id: "nRvd9SFSj0A",
    title: "Pathfinder Werewolf guide video",
  },
};

/**
 * The YouTube panel only appears on pages that have a video, so pages
 * without one lead with the Twitch stream instead of an empty box.
 */
export function YouTubePanel() {
  const pathname = usePathname();
  const pagePath = pathname.replace(/\/+$/, "") || "/";
  const video = pageVideos[pagePath];

  if (!video) return null;

  return (
    <section className={styles.sidebarPanel}>
      <h2>
        <svg className={styles.channelIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M22 7s-.2-1.5-.8-2.2c-.8-.8-1.7-.8-2.1-.9C16.2 3.7 12 3.7 12 3.7s-4.2 0-7.1.2c-.4.1-1.3.1-2.1.9C2.2 5.5 2 7 2 7s-.2 1.8-.2 3.6v1.7c0 1.8.2 3.6.2 3.6s.2 1.5.8 2.2c.8.8 1.9.8 2.4.9 1.8.2 6.8.2 6.8.2s4.2 0 7.1-.2c.4-.1 1.3-.1 2.1-.9.6-.7.8-2.2.8-2.2s.2-1.8.2-3.6v-1.7C22.2 8.8 22 7 22 7ZM10 14.9V8.7l5.5 3.1-5.5 3.1Z" />
        </svg>
        YouTube
      </h2>
      <div className={styles.youtubeMedia}>
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
      </div>
    </section>
  );
}
