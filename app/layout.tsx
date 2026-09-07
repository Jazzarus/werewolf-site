import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import "./globals.css";
import styles from "./layout.module.css";

const navigationLinks = [
  { href: "/", label: "Home" },
  { href: "/werewolf-general", label: "Werewolf" },
  { href: "/tier-list", label: "Tier List" },
  { href: "/faq", label: "FAQ" },
  { href: "/research", label: "Research" },
  { href: "/community", label: "Community" },
  { href: "/jazzarus", label: "Jazzarus" },
];

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
        <header>
          <div className={styles.banner}>BANNER</div>

          <nav className={styles.navbar} aria-label="Main navigation">
            <ul className={styles.navList}>
              {navigationLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <div className={styles.pageLayout}>
          <div className={styles.content}>{children}</div>

          <aside className={styles.sidebar}>
            <section>
              <h2>YouTube</h2>
              <div className={styles.mediaPlaceholder}>
                YouTube placeholder
              </div>
            </section>

            <section>
              <h2>Twitch</h2>
              <div className={styles.mediaPlaceholder}>
                Twitch placeholder
              </div>
            </section>
          </aside>
        </div>
      </body>
    </html>
  );
}
