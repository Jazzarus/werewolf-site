"use client";

import { useEffect, useState } from "react";
import styles from "./layout.module.css";

/** Shows once the reader has scrolled roughly a screen down the page. */
const SHOW_AFTER_PX = 700;

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setIsVisible(window.scrollY > SHOW_AFTER_PX);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    frame = window.requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  function scrollToTop() {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    // Return keyboard focus to the top of the page as well.
    document.getElementById("top")?.focus({ preventScroll: true });
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  return (
    <button
      type="button"
      className={`${styles.backToTop}${isVisible ? ` ${styles.backToTopVisible}` : ""}`}
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 15.5 12 8.5l7 7" />
      </svg>
    </button>
  );
}
