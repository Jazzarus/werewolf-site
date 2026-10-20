import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";
import "./globals.css";
import styles from "./layout.module.css";
import { SiteNavigation } from "./SiteNavigation";
import { TwitchPlayer } from "./TwitchPlayer";
import { BackToTop } from "./BackToTop";
import { GemSliders } from "./GemSliders";
import { YouTubePanel } from "./YouTubePlayer";

const fontin = localFont({
  src: "../public/fontin.otf",
  variable: "--font-fontin",
  display: "swap",
  weight: "400",
  style: "normal",
});

export const metadata: Metadata = {
  title: {
    default: "Werewolf Guides | Path of Exile 2",
    template: "%s | Werewolf Guides",
  },
  description:
    "Werewolf builds, ascendancy guides, tier lists, and research for Path of Exile 2.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontin.variable} ${styles.html}`}
    >
      <body className={styles.body}>
        <header className={styles.siteHeader} id="top" tabIndex={-1}>
          <div className={styles.banner}>
            <Image
              className={styles.bannerArt}
              src="/assets/white-wolf-art.webp"
              alt=""
              aria-hidden="true"
              width={3836}
              height={2156}
              preload
            />
            <Link className={styles.brand} href="/werewolf">
              <Image
                className={styles.brandMark}
                src="/assets/poe2-logo.png"
                alt="Path of Exile 2"
                width={269}
                height={212}
                preload
              />
            </Link>
          </div>

          <SiteNavigation />
        </header>

        <div className={styles.pageLayout}>
          <div className={styles.content}>{children}</div>

          <aside className={styles.sidebar} aria-label="Creator channels">
            <YouTubePanel />

            <section className={`${styles.sidebarPanel} ${styles.twitchPanel}`}>
              <h2>
                <svg className={styles.channelIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M4 2 1 6v15h6v3l3-3h5l7-7V2H4Zm16 11-4 4h-6l-3 3v-3H4V4h16v9ZM16 7h-2v6h2V7Zm-5 0H9v6h2V7Z" />
                </svg>
                Twitch
              </h2>
              <div className={styles.twitchMedia}>
                <TwitchPlayer />
                <a
                  className={styles.twitchFallback}
                  href="https://www.twitch.tv/jazzarus_"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Watch Jazzarus on Twitch
                </a>
              </div>
            </section>
          </aside>
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerDivider} aria-hidden="true" />
          <p>Unofficial Path of Exile 2 community resource.</p>
        </footer>

        <BackToTop />
        <GemSliders />
      </body>
    </html>
  );
}
