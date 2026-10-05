"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./layout.module.css";

const navigationLinks = [
  { href: "/werewolf", label: "Home" },
  { href: "/werewolf-general", label: "Werewolf" },
  { href: "/tier-list", label: "Tier List" },
  { href: "/farms", label: "Farms" },
  { href: "/faq", label: "FAQ" },
  { href: "/research", label: "Research" },
  { href: "/community", label: "Community" },
  { href: "/art", label: "Art" },
  { href: "/jazzarus", label: "Jazzarus" },
] as const;

function isCurrentRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNavigation() {
  const pathname = usePathname();

  function renderLinks(closeMenu = false) {
    return navigationLinks.map((link) => {
      const isCurrent = isCurrentRoute(pathname, link.href);

      return (
        <li key={link.href}>
          <Link
            className={isCurrent ? styles.activeNavLink : undefined}
            href={link.href}
            aria-current={isCurrent ? "page" : undefined}
            onClick={
              closeMenu
                ? (event) =>
                    event.currentTarget
                      .closest("details")
                      ?.removeAttribute("open")
                : undefined
            }
          >
            {link.label}
          </Link>
        </li>
      );
    });
  }

  return (
    <nav className={styles.navbar} aria-label="Main navigation">
      <ul className={styles.navList}>{renderLinks()}</ul>

      <details className={styles.mobileMenu}>
        <summary>
          <span className={styles.menuIcon} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          Menu
        </summary>
        <ul>{renderLinks(true)}</ul>
      </details>
    </nav>
  );
}
