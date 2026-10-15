"use client";

import { useEffect, useState } from "react";
import styles from "./layout.module.css";

export function TwitchPlayer() {
  const [playerUrl, setPlayerUrl] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({
      channel: "jazzarus_",
      parent: window.location.hostname,
      autoplay: "true",
      muted: "true",
    });
    setPlayerUrl(`https://player.twitch.tv/?${params.toString()}`);
  }, []);

  if (!playerUrl) {
    return <div className={styles.twitchLoading}>Loading Twitch player…</div>;
  }

  return (
    <iframe
      className={styles.twitchPlayer}
      src={playerUrl}
      title="Jazzarus live on Twitch"
      width="400"
      height="300"
      allow="autoplay; fullscreen"
      allowFullScreen
    />
  );
}
