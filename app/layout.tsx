import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";
import "./globals.css";
import styles from "./layout.module.css";
import { SiteNavigation } from "./SiteNavigation";

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
        <header className={styles.siteHeader}>
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
            <section className={styles.sidebarPanel}>
              <h2>
                <svg className={styles.channelIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M22 7s-.2-1.5-.8-2.2c-.8-.8-1.7-.8-2.1-.9C16.2 3.7 12 3.7 12 3.7s-4.2 0-7.1.2c-.4.1-1.3.1-2.1.9C2.2 5.5 2 7 2 7s-.2 1.8-.2 3.6v1.7c0 1.8.2 3.6.2 3.6s.2 1.5.8 2.2c.8.8 1.9.8 2.4.9 1.8.2 6.8.2 6.8.2s4.2 0 7.1-.2c.4-.1 1.3-.1 2.1-.9.6-.7.8-2.2.8-2.2s.2-1.8.2-3.6v-1.7C22.2 8.8 22 7 22 7ZM10 14.9V8.7l5.5 3.1-5.5 3.1Z" />
                </svg>
                YouTube
              </h2>
              <div className={styles.mediaPlaceholder}>
                Latest videos coming soon
              </div>
            </section>

            <section className={styles.sidebarPanel}>
              <h2>
                <svg className={styles.channelIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M4 2 1 6v15h6v3l3-3h5l7-7V2H4Zm16 11-4 4h-6l-3 3v-3H4V4h16v9ZM16 7h-2v6h2V7Zm-5 0H9v6h2V7Z" />
                </svg>
                Twitch
              </h2>
              <div className={styles.mediaPlaceholder}>
                Livestream schedule coming soon
              </div>
            </section>
          </aside>
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerDivider} aria-hidden="true" />
          <p>Unofficial Path of Exile 2 community resource.</p>
        </footer>
      </body>
    </html>
  );
}
